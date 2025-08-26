import { db } from "~/db";
import { createTRPCRouter, crmProcedure } from "./init";

export const crmRouter = createTRPCRouter({
  getUsers: crmProcedure.query(async () => {
    return await db.query.usersTable.findMany();
  }),
});
