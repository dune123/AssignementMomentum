import { rest } from "msw";

export const handlers = [
  rest.post("/carts/:cartId", (req, res, ctx) => {
    return res(ctx.json(["Laptop", "Phone"])); // Mocked response
  }),
];
