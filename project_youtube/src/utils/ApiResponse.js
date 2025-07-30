class ApiResponse{
    constructor(statusCode,data,message="Request successful",errors=[]){
        this.statusCode = statusCode<400;
        this.data = data;
        this.message = message;
        this.errors = errors;
        this.success = true;

        if(!data){
            this.success = false;
            this.data = null;
        }
    }
}