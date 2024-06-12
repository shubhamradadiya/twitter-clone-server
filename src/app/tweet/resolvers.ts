
import { Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";

interface CreateTweetPayload {
    content : string;
    imageURL?: string;
}

const queries={
    getAllTweets:async()=> await prismaClient.tweet.findMany({orderBy:{createdAt:"desc"}}),
}

const mutation={
    createTweet: async(  
        parent:any,
        {payload}:{payload:CreateTweetPayload},
        ctx:GraphqlContext
    )=>{
        if(!ctx.user) throw new Error("You are not authenticated");
      const tweet = await prismaClient.tweet.create({
            data:{
                content : payload.content,
                imageURL : payload.imageURL,
                author : {connect:{id:ctx.user.id}},
            }
        });

        return tweet;
    },
};

const extraResolvers = {
    Tweet :{
        author:async (parent:Tweet) => {
          const tweet = await  prismaClient.user.findUnique({where:{id:parent.authorId}});
          return tweet;
        } 
    }

}

export const resolvers = {mutation ,extraResolvers,queries};