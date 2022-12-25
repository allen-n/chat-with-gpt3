# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.


### Prisma setup workaround!
Prisma migrate wasn't working... [Source](https://github.com/prisma/prisma/issues/16853#issuecomment-1364180940)

* ran prisma migrate reset (successfully)
* added SHADOW_DATABASE_URL in my .env file and set it to the same value as DATABASE_URL (link says url and shadowDatabaseUrl should not be the same values)
* added shadowDatabaseUrl = env("SHADOW_DATABASE_URL") to my shema.prisma datasource db config
* ran prisma generate (successfully)
* ran prisma db push (successfully)
* ran prisma migrate dev (successfully)
