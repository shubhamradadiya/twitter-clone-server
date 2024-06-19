// const  express =  require('express');
// const  app = express();

import  express  from "express";
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import bodyParser from "body-parser";
import { User } from "./user";
import { Tweet } from "./tweet";
import cors from 'cors';
import JWTService from "../services/jwt";
import { GraphqlContext } from "../interfaces";


export async function initServer(){
    const app = express();

    app.use(bodyParser.json());
    app.use(cors());

   //  graphQl //////////////////////////////

    const graphqlServer = new ApolloServer<GraphqlContext>({
        typeDefs:`
        ${User.types}
        ${Tweet.types}
        
        type Query{
          ${User.queries}
          ${Tweet.queries}
        }
         
        type Mutation{
          ${Tweet.mutation}
          ${User.mutations}
        }

        
        
        `,
        resolvers:{
            Query: {
               ...User.resolvers.queries,
               ...Tweet.resolvers.queries,
            },
            Mutation:{
              ...Tweet.resolvers.mutation,
              ...User.resolvers.mutations,
            },
            ...Tweet.resolvers.extraResolvers,
            ...User.resolvers.extraResolvers 
        },
      });

    await graphqlServer.start();
    app.use("/graphql" , expressMiddleware(graphqlServer , {
      context: async({req , res})=>{
        return {
          user: req.headers.authorization ? JWTService.decodeToken(req.headers.authorization.split("Bearer ")[1]) : undefined

        };
      },
    })

    ); 

    /////////////////////////////

    return app;
}