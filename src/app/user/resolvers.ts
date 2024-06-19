import axios from 'axios';
import { prismaClient } from '../../clients/db';
import { PrismaClient, User } from '@prisma/client';
import JWTService from '../../services/jwt';
import { GraphqlContext } from '../../interfaces';
import UserService from '../../services/user';
import {redisClient} from '../../clients/redis';



const queries ={
    verifyGoogleToken : async(parent:any ,{token}:{token:string})=>{
     const resultToken = await UserService.verifyGoogleAuthToken(token);
     return resultToken;
 },

    getCurrentUser: async(parent:any, arg:any , ctx : GraphqlContext)=>{

       const  id =ctx.user?.id;
       if(!id) return null; 

       const user = await UserService.getUserById(id);
       return user
    },

    getUserById:async(parent:any, 
        {id}:{id:string} ,
         ctx : GraphqlContext
        ) => {
            try {
             return   await UserService.getUserById(id);
            } catch (error) {
                console.log(error)
                return null;

            }
        }
 
};

const extraResolvers = {
    User :{
        //todo tweets
        tweets:async(parent:User)=>{
          return await prismaClient.tweet.findMany({where:{ author: {id: parent.id}}})
        },

        //todo followers
        followers:async(parent:User)=>{
            const result=await prismaClient.follows.findMany({
                where:{ following: {id: parent.id}},
                include: {  
                    follower:true
                }  
            
            })
            return result.map((el)=>el.follower)
        },
        //todo following
        following:async(parent:User)=>{
          const result= await prismaClient.follows.findMany({
            where:{  follower: {id: parent.id}},
            include: {  
                following:true
            }
        })
          return result.map((el)=>el.following);
        },

        //todo suggestionUsers
        recommendedUsers: async(parent:User, _:any , ctx:GraphqlContext)=>{
            if(!ctx.user) return [];
            //?Redis cash  value get
            const cashValue = await redisClient.get(`RECOMMENDED_USER:${ctx.user.id}`);
          
            if(cashValue) {
                console.log("first cash value!!!!!!!!")
                console.log(cashValue)
                return JSON.parse(cashValue)
            }

            const myFollowings = await prismaClient.follows.findMany({
                where:{
                    follower:{id:ctx.user.id}
                },
                  include:{
                    following : {
                        include:{followers :{ include:{following:true} }}
                    }
                  }
            })


            const users: User[] = []

                        //current A following B 
            for(const currentUserFollowing of myFollowings){
                        //B following C
                for(const followingOfFollowedUser of currentUserFollowing?.following?.followers){
                    if(followingOfFollowedUser?.following?.id !== ctx.user.id &&
                        myFollowings.findIndex(
                            (el)=>el?.followingId === followingOfFollowedUser?.following?.id)<0
                    ){

                            users.push( followingOfFollowedUser.following);
                    }
                }
            }
            console.log("not cash value!!!!!!!!")

            //? Redis cash value
            await redisClient.set(
                `RECOMMENDED_USER:${ctx.user.id}`,
                JSON.stringify(users)
            )

            return users;
        }

    }
}

const mutations ={
     followUser:async (parent:any ,{to}:{to:string},ctx:GraphqlContext )=>{
        if(!ctx.user||!ctx.user.id) throw new Error ("unAuthorized for follow")
        
        await UserService.followUser(ctx.user.id , to );

        await redisClient.del(`RECOMMENDED_USER:${ctx.user.id}`)
        return true;
       
     },
     unfollowUser:async (parent:any ,{to}:{to:string},ctx:GraphqlContext )=>{
        if(!ctx.user||!ctx.user.id) throw new Error ("unAuthorized for follow")
        
        await UserService.unfollowUser(ctx.user.id , to );
      
        await redisClient.del(`RECOMMENDED_USER:${ctx.user.id}`)
        return true;
       
     }
}

export const  resolvers ={queries ,extraResolvers ,mutations}