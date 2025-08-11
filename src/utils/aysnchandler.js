const asynchandler=(requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).
        catch((Error)=>next(Error))
    }
}

export { asynchandler}









// //const asynchandler=(fn)=>()=>{}   //higher order function that takes a function as an argument
// //const asynchandler=(fn)=>{()=>{}}
    
    
// const asynchandler=(fn)=>async(req,res,next)=>{
//     try {
//         await fn(req,res,next)
        
//     } catch (error) {
//         res.status(error.code||500).json({
//             success:false,
//             message:error.message
//         })
//     }
// }