class APIresponse{
    constructor(statusCode,data,message){
        this.statusCode=statusCode
        this.data=data
        this.message=message
        this.success=statusCode<400    //generally https codes over 400 are for errors so in this case if statusCode is more than 400 then this becomes false
    }
}

export{APIresponse}