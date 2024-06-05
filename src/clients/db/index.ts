import { PrismaClient } from "@prisma/client";

//this is use for instance As a write a  query like CRUD operations it just like a mongoose
//log: ["query"] is a print a  query when we call 

export const prismaClient = new PrismaClient({ log: ["query"]});