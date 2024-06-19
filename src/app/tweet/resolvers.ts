
import { Tweet } from "@prisma/client";
import {S3Client , PutObjectCommand} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import TweetService, { CreateTweetPayload } from "../../services/tweet";




const s3Client = new S3Client({
    region: process.env.AWS_DEFAULT_REGION,
})

//TOdo:  QUERIES 
const queries={
    getAllTweets:async()=> TweetService.getAllTweets(),

    //S3 requests 
    getSignedURLForTweet : async(
        parent: any,
        {imageType , imageName}:{imageType:string , imageName:string},
        ctx:GraphqlContext
    )=>{
     
        if(!ctx.user|| !ctx.user.id) 
            throw new Error("Unauthorized");

        const allowedImageTypes =["jpg", "png", "jpeg", "webp"];

        if(!allowedImageTypes.includes(imageType as string)) 
            throw new Error("Unsupported image type");

        const putObjectCommand = new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key:`upload/${ctx.user.id}/tweets/${imageName}-${Date.now().toString()}.${imageType}`
        });

        const signedUrl = await getSignedUrl(s3Client,putObjectCommand  );

        return signedUrl
    }
}


//todo  Mutations
const mutation={
    createTweet: async(  
        parent:any,
        {payload}:{payload:CreateTweetPayload},
        ctx:GraphqlContext
    )=>{
        if(!ctx.user) throw new Error("You are not authenticated");
      const tweet = await  TweetService.createTweet({
        ...payload,
        userId: ctx.user.id,
      })

        return tweet;
    },
};



//todo ExtraResolvers
const extraResolvers = {
    Tweet :{
        author:async (parent:Tweet) => {
          const tweet = await  prismaClient.user.findUnique({where:{id:parent.authorId}});
          return tweet;
        } 
    }

}

export const resolvers = {mutation ,extraResolvers,queries};