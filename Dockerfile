# Build stage. The full toolchain, dev dependencies and yarn cache live here
# and none of it reaches the final image.
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile && yarn cache clean

COPY . .
RUN yarn build

# Runtime stage. Carries only Next's standalone output, so the image went from
# 3.31GB to a couple hundred MB. The old single-stage image shipped the source,
# the dev dependencies and the yarn cache, which is why `yarn install` could no
# longer fit on the droplet's disk.
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# The standalone server binds localhost by default, which is unreachable from
# nginx in another container.
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
