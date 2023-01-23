import { useSession } from "next-auth/react";
import { useState } from "react";

import { trpc } from "../utils/trpc";

export const ApiUsage: React.FC = () => {
  const { data: sessionData } = useSession();
  const apiUsage = trpc.billing.getUsage.useQuery(
    {
      // TODO @allen-n: consider adding date filters on the FE
      req: {},
    },
    {
      enabled: sessionData?.user !== undefined,
      staleTime: 3600000 * 2, // 2 hours in ms
      cacheTime: 3600000 * 2, // 2 hours in ms
    }
  );

  const refreshUsage = () => {
    apiUsage.refetch();
  };

  return (
    sessionData && (
      <div className="text-s text-align-center w-full justify-center text-center">
        <p className="max-w-xs text-center text-white">
          Total 💸 spent:{" "}
          {apiUsage.isLoading || apiUsage.isFetching || !apiUsage.data
            ? "⏳"
            : "$" + apiUsage.data.totalBillable.toPrecision(2)}
        </p>
        <button
          className="w-full rounded-md bg-white/10 p-1 font-semibold text-white no-underline transition hover:animate-bottom-bounce hover:bg-white/20"
          onClick={refreshUsage}
        >
          Re-fresh Usage 🔁
        </button>
      </div>
    )
  );
};
