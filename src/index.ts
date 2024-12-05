
import * as dotenv from "dotenv"
import { initServer } from "./app";

dotenv.config();

async function init(){
    const app = await initServer();
    app.listen(process.env.PORT , ()=> console.log("listening at  PORT 8000"));

}

init();