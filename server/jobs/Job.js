const logger = require('../utils/logger')
const models = require('../models/index')
const JobModel = models.Job

class Job{
    constructor(){
        // The user ID initiating the job
        this.userId = null
        // The model name initiating the job
        this.modelName = null
        // The created job ID
        this.jobId = null  
        // Function 
        this.process = null   
    }
    /**
     * Set the job's (initiated by a user and model job) status to 'completed'
     * @returns {void}
     */      
    async completeJob()
    {
        await JobModel.update(
            {status: 2}, {where: {id: this.jobId}}
        )
    }
    /**
     * Set the job's (initiated by a user and model job) status to 'failed'
     * @returns {void}
     */       
    async setToFailJob()
    {
        await JobModel.destroy({where: {id: this.jobId}})
    }    
    async getJob()
    {
        return await JobModel.findOne({
            attributes: ['id', 'result', 'status'],
            where: {id: this.jobId}
        })
    }
    /**
     * Get all jobs initiated by a user and model job 
     * When the job is completed, remove it
     * @returns {array} - All jobs with status 'processing' or 'completed'
     */
    async getAllJobs()
    {
        let jobs = await JobModel.findAll({
            attributes: ['id', 'result', 'status'],
            where: {user_id: this.userId, model: this.modelName}
        })
        const completedJobIds = jobs.filter(job => parseInt(job.status) === 2).map(job => job.id)
        if(completedJobIds.length){
            await JobModel.destroy({
                where: {id: completedJobIds}
            })
        }
        return jobs
    }
    /**
     * Create the job and process it
     * @param {*} payload - The data need for processing the job
     * @returns {integer} - The job ID
     */
    async dispatch(payload){
        const job = await JobModel.create({
            user_id: this.userId,
            model: this.modelName,
            status: 1,
        })
        this.jobId = job.id
        this.process(payload)
            .then(async () => {
                await this.completeJob()
            })
            .catch(async error => {
                await this.setToFailJob()
                logger.error(error, {errorObj: error})
            })
        return this.jobId
    }
}

module.exports = Job