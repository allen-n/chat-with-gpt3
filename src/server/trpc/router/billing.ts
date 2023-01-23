import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  GoogleASRRequest,
  GoogleTTSRequest,
  OpenaiCompletionRequest,
} from "@prisma/client";

const billableApiTypes = ["asr", "tts", "llm"] as const;

export const UsageRequest = z.object({
  startTime: z.date().nullish(),
  endTime: z.date().nullish(),
  apis: z.array(z.enum(billableApiTypes)).default([...billableApiTypes]),
});

export const UsageResponse = z.object({
  startTime: z.date(),
  endTime: z.date(),
  totalBillable: z.number(),
});

export const SubscriptionStatusResponse = z.object({
  subscriptionStatus: z.string(),
  isSubscribed: z.boolean(),
});

export type UsageRequest = z.infer<typeof UsageRequest>;
export type UsageResponse = z.infer<typeof UsageResponse>;
export type SubscriptionStatusResponse = z.infer<
  typeof SubscriptionStatusResponse
>;

type BillingWithTimestamp = {
  endTime: Date;
  startTime: Date;
  billing: number;
};

/**
 * Compute total cost of OpenAI completion requests passed in
 * @param items
 * @returns
 */
const computeBillingCompletion = (
  items: OpenaiCompletionRequest[]
): BillingWithTimestamp => {
  let startTimestamp: Date | undefined = undefined;
  let endTimestamp: Date | undefined = undefined;
  // https://openai.com/api/pricing/
  const modelCostsPerToken: { [id: string]: number } = {
    "text-davinci-003": 0.00002,
    "text-curie-001": 0.000002,
    "text-babbage-001": 0.0000005,
    "text-ada-001": 0.0000004,
  };
  const totalCost = items.reduce((acc, item) => {
    if (item.createdAt) {
      if (!startTimestamp || item.createdAt > startTimestamp) {
        startTimestamp = item.createdAt;
      }
      if (!endTimestamp || item.createdAt < endTimestamp) {
        endTimestamp = item.createdAt;
      }
    }
    const modelCost = modelCostsPerToken[item.model];
    if (item.model && modelCost) {
      acc += item.totalTokens * modelCost;
    } else {
      console.error(
        `Model ${item.model} not found in modelCostsPerToken! Cost not being accounted for!`
      );
    }
    return acc;
  }, 0);
  return {
    billing: totalCost,
    startTime: startTimestamp || new Date(0), // Default to UTC 1970-01-01 00:00:00
    endTime: endTimestamp || new Date(0), // Default to UTC 1970-01-01 00:00:00
  };
};

/**
 * Compute total cost of Google Text to speech requests passed in
 * @param items
 * @returns
 */
const computeBillingTts = (items: GoogleTTSRequest[]): BillingWithTimestamp => {
  let startTimestamp: Date | undefined = undefined;
  let endTimestamp: Date | undefined = undefined;
  const voiceCostsPerChar = { standard: 0.000004, waveNet: 0.000016 }; // https://cloud.google.com/text-to-speech/pricing
  const totalCost = items.reduce((acc, item) => {
    if (item.modelName.includes("Standard")) {
      acc += item.billableSize * voiceCostsPerChar.standard;
    } else {
      acc += item.billableSize * voiceCostsPerChar.waveNet;
    }
    if (item.createdAt) {
      if (!startTimestamp || item.createdAt > startTimestamp) {
        startTimestamp = item.createdAt;
      }
      if (!endTimestamp || item.createdAt < endTimestamp) {
        endTimestamp = item.createdAt;
      }
    }
    return acc;
  }, 0);

  return {
    billing: totalCost, // https://cloud.google.com/text-to-speech/pricing
    endTime: startTimestamp || new Date(0), // Default to UTC 1970-01-01 00:00:00
    startTime: endTimestamp || new Date(0), // Default to UTC 1970-01-01 00:00:00
  } as BillingWithTimestamp;
};

/**
 * Compute total cost of Google speech to text requests passed in
 * @param items
 * @returns
 */
const computeBillingAsr = (items: GoogleASRRequest[]): BillingWithTimestamp => {
  let startTimestamp: Date | undefined = undefined;
  let endTimestamp: Date | undefined = undefined;
  const totalTime = items.reduce((acc, item) => {
    acc += item.billableTimeSeconds + (item.billableTimeNanos || 0) / 1e9;
    if (item.createdAt) {
      if (!startTimestamp || item.createdAt > startTimestamp) {
        startTimestamp = item.createdAt;
      }
      if (!endTimestamp || item.createdAt < endTimestamp) {
        endTimestamp = item.createdAt;
      }
    }
    return acc;
  }, 0);

  return {
    billing: totalTime * 0.00016, // https://cloud.google.com/speech-to-text/pricing
    endTime: startTimestamp || new Date(0), // Default to UTC 1970-01-01 00:00:00
    startTime: endTimestamp || new Date(0), // Default to UTC 1970-01-01 00:00:00
  } as BillingWithTimestamp;
};

type TotalBilling = {
  startTime: Date;
  endTime: Date;
  totalBillable: number;
};

const computeTotalBilling = (
  billings: BillingWithTimestamp[]
): TotalBilling => {
  let startTimestamp: Date | undefined = undefined;
  let endTimestamp: Date | undefined = undefined;
  let totalBillable = 0;
  for (const billing of billings) {
    if (!startTimestamp || billing.startTime > startTimestamp) {
      startTimestamp = billing.startTime;
    }
    if (!endTimestamp || billing.endTime < endTimestamp) {
      endTimestamp = billing.endTime;
    }
    totalBillable += billing.billing;
  }
  totalBillable = Math.round(totalBillable * 10000) / 100000;
  return {
    startTime: startTimestamp || new Date(0),
    endTime: endTimestamp || new Date(0),
    totalBillable: totalBillable,
  } as TotalBilling;
};

export const billingRouter = router({
  /**
   * Get billing information for a user. Note that this request makes 3 separate db Queries that can get expensive
   */
  getUsage: protectedProcedure
    .input(z.object({ req: UsageRequest }))
    .query(async ({ input, ctx }) => {
      const prisma = ctx.prisma;
      const userId = ctx.session.user.id;
      const startTime = input?.req.startTime;
      const endTime = input?.req.endTime;
      const apis = input?.req.apis || [...billableApiTypes];

      const createdAtFilter = {
        gte: startTime ? startTime : undefined,
        lte: endTime ? endTime : undefined,
      };

      const billings: BillingWithTimestamp[] = [];
      for (const api of apis) {
        switch (api) {
          case "asr":
            const asr = await prisma.googleASRRequest.findMany({
              where: {
                userId: userId,
                createdAt: createdAtFilter,
              },
            });
            const asrBilling = computeBillingAsr(asr);
            billings.push(asrBilling);
            break;
          case "tts":
            const tts = await prisma.googleTTSRequest.findMany({
              where: {
                userId: userId,
                createdAt: createdAtFilter,
              },
            });
            const ttsBilling = computeBillingTts(tts);
            billings.push(ttsBilling);
            break;
          case "llm":
            const llm = await prisma.openaiCompletionRequest.findMany({
              where: {
                userId: userId,
                createdAt: createdAtFilter,
              },
            });
            const llmBilling = computeBillingCompletion(llm);
            billings.push(llmBilling);
            break;
          default:
            console.error(`Unknown API type: ${api}`);
        }
      }
      const totalBilling = computeTotalBilling(billings);
      return {
        startTime: totalBilling.startTime,
        endTime: totalBilling.endTime,
        totalBillable: totalBilling.totalBillable,
      } as UsageResponse;
    }),
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const prisma = ctx.prisma;
    const userId = ctx.session.user.id;
    const subscriptionResponse = await prisma.userSubscription.findFirst({
      where: {
        userId: userId,
      },
    });
    return {
      isSubscribed: subscriptionResponse?.isSubscribed || false,
      subscriptionStatus: subscriptionResponse?.status || "",
    } as SubscriptionStatusResponse;
  }),
});
