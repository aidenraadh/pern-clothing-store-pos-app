const Job = require('./Job')

class SampleJob extends Job{
    constructor(userId){
        super()
        try {
            if(userId === undefined){
                throw 'userId must be defined'
            }
            this.userId = userId
            this.modelName = 'SampleJob'

            this.process = async (data = null) => {
                // Your process logic here
            }
        } catch (error) {
            throw new Error(error)
        }
    }
}

module.exports = SampleJob
/*

This is a sample job

To create your own job class copy-paste the content of this file

Change the name of the class from SampleJob to yor JobName, 
dont forget to change 'this.modelName' to 'JobName' as well

1. Change the name of the class from SampleJob to yor YourJob, 
dont forget to change 'this.modelName' to 'YourJob' as well

3. Specify the job's process logic inside 'this.process'
This function accepts 'data' that can be used as some data for processing the job

4. To run the job simply:
await new YourJob(your_user_id).dispatch(data)
'data' can be used as some data for processing the job

5. To update the job's result while inside 'this.process' method, simply:
this.updateResult('new value')

6. To get all jobs initiated by a you and model job, that is still processing or completed:
await new YourJob(your_user_id).retrieveJobs()
 */