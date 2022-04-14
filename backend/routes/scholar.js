const router = require('express').Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
var nodemailer = require('nodemailer');
const Credentials = require('../model/Credentials');


const {generateToken}= require('../model/Scholar');

const Scholar = require('../model/Scholar');

const User = require('../model/User');
const ResetPassword = require('../model/resetPasswordSchema');
const {validateScholarRegistration, validateScholarCreate, validateScholarLogin, validate, isResetTokenValid} = require('../userinputvalidation');
const cookieParser = require('cookie-parser');
const { createRandomBytes  } = require('../helper');
const { generateCreateUserMail, generatePasswordResetMail , generateSuccessPasswordResetMail } = require('../mail');

router.post('/create-user', validateScholarCreate, async(req,res)=>{
    try{ 
        console.log("1 here")
        console.log("2 req.body.email  "+req.body.email)
        const scholarExists= await Scholar.findOne({"loginDetails.email":req.body.email  })
        console.log("3 scholarExists  "+scholarExists)
        if(scholarExists) return res.json({success: false, message:"Already registered"})
        console.log("4 here")
        const emailExists= await Credentials.findOne({"email":req.body.email})
        console.log("5 emailExists"+ emailExists)
        if(!emailExists) 
        {const user = new Credentials({email:req.body.email, username: req.body.username})
        await user.generateToken();
        await user.save()
        
        var transporter = nodemailer.createTransport({
            host : "smtp.mailtrap.io",
            port : 2525,
            auth: {
                user: process.env.MAILTRAP_USERNAME,
                pass: process.env.MAILTRAP_PASSWORD
            }
        });
        console.log('6 created');
        const date = new Date()
        console.log('7 here');
        transporter.sendMail({
            from: 'placementcellducs@cs.du.ac.in',
            to: `${user.email}`,
            subject: `Registration for DUCS Placement Cell for session ${date.getFullYear()}`,
            attachments: [{
                filename: 'logo.png',
                path: __dirname+'/img/logo.png',
                cid: 'logo'
            }],
            html: generateCreateUserMail(`http://localhost:3000/scholar-registration?email=${user.email}`, user.username ),
            // html: generateCreateUserMail(`http://localhost:3000/scholar-registration?email=${user.email}&user=${user.username}&token=${user.token}`, user.username ),
     
        });
    }
        console.log('8 email sent');
        return res.json({success:200, message:'Email has been sent '})

    }catch(error){
        console.log("create user error part:: An error has occurred : "+error)
    }
    
}); 
router.post('/verify-email', async(req, res)=>{
    const email = req.body.email
    console.log("0 req.body"+JSON.stringify(req.body))
    console.log("1 email"+ email)
    const exists = await Scholar.findOne({"loginDetails.email": email})
    console.log("2 exists"+ exists)
    if(exists) return res.status(200).json({success: true, message:"already registered"})
    return res.status(400).json({success: false, message:"Notregistered"})
})
router.post('/register', validateScholarRegistration, validate , async (req, res)=>{
    try{
        console.log("hello")
        
        const user = await Scholar.findOne({"loginDetails.email":req.body.loginDetails.email})
        if(user) return res.status(400).json({success:false, message:"You already have an account"}).send("You already have an account")
        console.log(req.body.loginDetails.password )
        console.log(req.body.loginDetails.username)
        console.log(req.body.loginDetails.confirmPassword)
        if(req.body.loginDetails.password !== req.body.loginDetails.confirmPassword)  return res.status(401).send("passwords do not match")

        
        console.log("1 reached here")
        var c=0
        console.log(c+" here")
        c++
        const {username, email } = req.body.loginDetails
        
        console.log(c+" here")
        c++
        const {fname,lname,dob,gender,phone,alternative_phone}= req.body.personalDetails
        
        console.log(c+" here")
        c++
        const {perma_addr1,perma_addr2,perma_state,perma_city,perma_pin}= req.body.personalDetails.permanent_addr
        
        console.log(c+" here")
        c++
        const {corr_addr1,corr_addr2,corr_state,corr_city,corr_pin}= req.body.personalDetails.correspondence_addr
        
        console.log(c+" here")
        c++
        const {pg_course,pg_exam_roll,pg_class_roll,pg_aggr_percentage,pg_backlogs,pg_backlog_details}= req.body.postGraduationDetails 
        
        console.log(c+" here")
        c++
        const {grad_college,grad_university,grad_course,grad_roll_no,grad_marks_obtained,grad_max_marks,grad_aggr_percentage,grad_year_of_passing}= req.body.graduationDetails 
        
        console.log(c+" here")
        c++
        const {inter_board, inter_roll_no, inter_marks_obtained, inter_max_marks, inter_aggr_percentage, inter_year_of_passing}= req.body.intermediateDetails       
        
        console.log(c+" here")
        c++
        const { high_board, high_roll_no, high_marks_obtained, high_max_marks, high_aggr_percentage, high_year_of_passing}= req.body.highSchoolDetails 
        
        console.log("8reached here")
        //hashing password
        const password = await bcrypt.hash(req.body.loginDetails.password, 8)
        console.log("9 hashed password"+password)
        const newScholar = new Scholar({
            loginDetails:{
                email,
                password,
                username 
            },
            personalDetails:{
                fname, lname,dob,gender,phone,alternative_phone,
                permanent_addr:{perma_addr1,perma_addr2,perma_state,perma_city,perma_pin},
                correspondence_addr:{corr_addr1,corr_addr2,corr_state,corr_city,corr_pin} 
            },
            postGraduationDetails : {pg_course,pg_exam_roll,pg_class_roll,pg_aggr_percentage,pg_backlogs,pg_backlog_details},
            graduationDetails :{grad_college,grad_university,grad_course,grad_roll_no,grad_marks_obtained,grad_max_marks,grad_aggr_percentage,grad_year_of_passing},
            intermediateDetails: {inter_board, inter_roll_no, inter_marks_obtained, inter_max_marks, inter_aggr_percentage, inter_year_of_passing},        
            highSchoolDetails : { high_board, high_roll_no, high_marks_obtained, high_max_marks, high_aggr_percentage, high_year_of_passing}
        });
            console.log("newScholar:: "+newScholar);
            
            // console.log("newuser:: "+newUser);
            const token = await newScholar.generateToken();
            await newScholar.save()
            res.cookie("jwt", token, {
                expires:new Date(Date.now()+3000),
                // secure:true,
                httpOnly: true
            });
            
            
            //const registered = await newUser.save()
            console.log(`Registered Scholar ${newScholar}`)  
            return res.status(201).json({success:true, message: `${newScholar.username} registered successfully`, newScholar })
            // await newUser.save()
            // res.status(201).send(`Registered user ${newUser}`)
            // console.log(`Registered user ${newUser}`)  
            // return res.json({success:true, message: `${newUser.username} registered successfully`, newUser })
        }catch{err => console.log(err);}
   
});
router.post('/login', validateScholarLogin, validate,  async (req, res)=>{
    const user = await Scholar.findOne({"loginDetails.email":req.body.loginDetails.email})
    console.log("check1")
    if(!user) return res.status(400).send("Invalid credentails");
    console.log("check2")
    
    const validPass = await bcrypt.compare(req.body.loginDetails.password, user.loginDetails.password)
    console.log("check3")

    if(!validPass) return res.status(400).send("Invalid credentails");
    console.log("check4")

    const token =await user.generateToken()
    console.log(`login:: token:: ${token}`)
    
    res.cookie("jwt", token, {
        expires:new Date(Date.now()+3000),
         // secure:true,
        httpOnly: true
    });
    console.log(user._id)

    res.status(200).json({success: true, message:"Logged in", user, token})
   
    
});

router.get('/profile/:id', async(req,res)=>{
    console.log("/profile/:id   passed route")
    console.log("id:: " + req.params.id) 
    console.log(req.params) 
    const id  = req.params.id

    const scholar = Scholar.findById({_id: req.params.id}, function (err, scholar) {
        if(err){
            console.log(err);
            return res.send(error)
        }
        else{
            console.log( scholar);
            return res.json({success:true ,message:`Retrieved scholar ${scholar.loginDetails.username}`, scholar}) 
        }})
});

router.get('/dashboard/:id', async(req,res)=>{
    const id = req.params.id
    
    
    const scholar = await Scholar.findOne({_id:id})
    console.log("Scholar "+ scholar)
    if(!scholar) return res.json({success: false , message:"Invalid request"})
    return res.json({success:true, data: scholar})
})


module.exports = router;  