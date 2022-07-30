import React from "react";
import { useState } from "react";
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import axios from 'axios'
import Alert from "react-bootstrap/Alert";
import Modal from "react-bootstrap/Modal";
import Spinner from 'react-bootstrap/Spinner'


const AcknowledgementForm = () => {

    //state variables to store the different information of the user
    const [ackNo, setAckNo] = useState("")
    const [assYr, setAssYr] = useState("")
    const [pan, setPan] = useState("")
    const [otp, setOtp] = useState('');
    const [aadhaarTxnId, setAadhaarTxnId] = useState('');

    //state variables for error handling 
    const [wrongAckNoAlert, setWrongAckNoAlert] = useState(false);
    const [alreadyVerified, setAlreadyVerified] = useState(false)
    const [otpExpired, setOtpExpired] = useState(false)
    const [invalidOtp, setInvalidOtp] = useState(false)
    const [successEverified, setSuccessEverified] = useState(false)
    const [otpLimitExceed, setOtpLimitExceed] = useState(false)
    const [errorCode500, setErrorCode500] = useState(false)

    //state variables to open or close the modals and spinner utilities
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false)


    //Different Functions

    async function submitDetails(e, assYr, pan, ackNo) {
        setShowSpinner(true)
        e.preventDefault()

        const axiosData = {
            "ackNum": ackNo,
            "areaCd": "91",
            "assmentYear": assYr,
            "countryCd": "IN",
            "entityNum": pan,
            "mobileNum": "1234567898",
            "serviceName": "eVerifyReturnPreLoginService"
        };

        // await axios.post('https://eportal.incometax.gov.in/iec/servicesapi/getEntity', axiosData)
        await axios({
            url:"https://eportal.incometax.gov.in/iec/servicesapi/getEntity",
            method:"POST",
            data: axiosData,   
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
            }
        })
            .then(response => {
                console.log(response.data)
                console.log(response.data.messages[0].code)

                if(response.status === 200)
                {   
                    if (response.data.messages[0].code === "EF40003") {
                        console.log(response.data.messages[0].code)
                        generateOtp(pan);
                    }
                    else if (response.data.messages[0].code === "EF00156") {
                        setWrongAckNoAlert(true);
                        setAckNo("");
                        setAssYr("");
                        setShowSpinner(false)
                    }
                    else {
                        console.log("Something went wrong in the exception")
                        setShowSpinner(false)
                        setErrorCode500(true)
                    }
                }
                
            })
            .catch(error => {
                setErrorCode500(true)
                setShowSpinner(false)
                statesDeleted();
                console.log(error)

            });


    }

    async function generateOtp(pan) {
        const body = {
            "panNumber": pan,
            "serviceName": "verifyOtpUsingAadhar"
        }

        await axios.post('https://eportal.incometax.gov.in/iec/verificationservices/saveEntity', body)
            .then((response) => {
                console.log("This is the response from the generated otp", response)
                setShowSpinner(false)
                if (response.data.status === "SUCCESS") {
                    setAadhaarTxnId(response.data.aadhaarTxnId);
                    setShowOtpModal(true);

                    console.log("This is the aadhaar Txn ID", aadhaarTxnId)
                }
                else if (response.data?.messages[0]?.code === "EF00226") {
                    setOtpLimitExceed(true)
                    setAckNo('')
                    setPan("")
                }

            })
            .catch((error) => {
                console.log("Error in the generate otp function.....", error)
            })
    }

    async function validateOtp(aadhaarTxnId, ackNo, pan, otp) {
        setShowSpinner(true)
        const body = {
            "aadhaarTxnId": aadhaarTxnId,
            "ackNum": ackNo,
            "moduleCode": "ITR",
            "otp": otp,
            "panNumber": pan,
            "selectionFlag": "L",
            "serviceName": "verifyOtpUsingAadhar",
            "verifPan": pan
        }

        await axios.post('https://eportal.incometax.gov.in/iec/verificationservices/validateOTP', body)
            .then((response) => {
                setShowOtpModal(false)
                setShowSpinner(false)
                setOtp('')

                console.log(response.data.messages['0'].code)
                if (response.data?.messages[1]?.code === "EF111199") {
                    console.log(response.data.messages[1].code)
                    setAlreadyVerified(true)
                    setAckNo('')
                    setPan("")
                }
                else if (response.data.messages["0"].code === "EF00128") {
                    console.log("this is otp expired", response.data.messages[0].code)
                    setOtpExpired(true)
                    setAckNo('')
                    setPan("")
                }
                else if (response.data.messages["0"].code === 'EF00028') {
                    console.log("this is invalid otp", response.data.messages[0].code)
                    setInvalidOtp(true)
                    setAckNo('')
                    setPan("")
                }
                else {
                    setSuccessEverified(true)


                }
            })
            .catch((error) => {
                console.log(error)
            })
    }

    async function downloadItr(ackNo) {
        setShowSpinner(true)
        const body = {
            "ackNum": ackNo,
            "action": "P",
            "serviceName": "downloadActionService"
        }

        await axios({
            url: 'https://eportal.incometax.gov.in/iec/servicesapi/getEntity', //your url
            method: 'POST',
            data: body,
            responseType: 'blob', // important
        }).then((response) => {
            setShowSpinner(false)
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${ackNo}_ITR_FORM.pdf`); //or any other extension
            document.body.appendChild(link);
            link.click();
        }).catch((error) => {
            console.log("Error downloading the file")
        })
    }

    async function downloadAckForm(ackNo) {
        setShowSpinner(true)
        const body = {
            "ackNum": ackNo,
            "action": "F",
            "ay": assYr,
            "serviceName": "downloadActionService"
        }

        await axios({
            url: 'https://eportal.incometax.gov.in/iec/servicesapi/getEntity', //your url
            method: 'POST',
            data: body,
            responseType: 'blob', // important
        }).then((response) => {
            setShowSpinner(false)
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${ackNo}_ACK_FORM.pdf`); //or any other extension
            document.body.appendChild(link);
            link.click();
        }).catch((error) => {
            console.log("Error downloading the file")
        })
    }

    function statesDeleted(e) {
        setAckNo("");
        setPan("");
        setSuccessEverified(false)

    }



    return (


        <div className="container">

            <h3 className="text-center mt-4 mb-5">E-verify Your Itr Return</h3>

            {otpLimitExceed ?
                (<div className="container">
                    <Alert show={otpLimitExceed} variant="primary" onClose={() => setOtpLimitExceed(false)} dismissible>
                        <Alert.Heading>Sorry You Cannot Generate OTP.......</Alert.Heading>
                        <p>
                            Try After Half An Hour.......
                        </p>

                    </Alert>
                </div>) : <div></div>}

            {errorCode500 ?
                (<div className="container">
                    <Alert show={errorCode500} variant="danger" onClose={() => setErrorCode500(false)} dismissible>
                        <Alert.Heading>Something Went Wrong In The Server</Alert.Heading>
                        <p>
                            This error is thrown by the Income Tax Department Servers. Try Again After Sometime
                        </p>

                    </Alert>
                </div>) : <div></div>}

            {alreadyVerified ?
                (<div className="container">
                    <Alert show={alreadyVerified} variant="primary" onClose={() => setAlreadyVerified(false)} dismissible>
                        <Alert.Heading>Your ITR is Already Verified......</Alert.Heading>
                        <p>
                            You Don't need to verify your ITR.....
                        </p>

                    </Alert>
                </div>) : <div></div>}

            {invalidOtp ?
                (<div className="container">
                    <Alert show={invalidOtp} variant="danger" onClose={() => setInvalidOtp(false)} dismissible>
                        <Alert.Heading>INVALID OTP........</Alert.Heading>
                        <p>
                            DO THE PROCESS AGAIN WITH CORRECT OTP
                        </p>

                    </Alert>
                </div>) : <div></div>}

            {otpExpired ?
                (<div className="container">
                    <Alert show={otpExpired} variant="warning" onClose={() => setOtpExpired(false)} dismissible>
                        <Alert.Heading>Your Otp Expired!!!!</Alert.Heading>
                        <p>
                            Generate a new one and Then Try again!!!!
                        </p>

                    </Alert>
                </div>) : <div></div>}

            {successEverified ?
                (
                    <Modal
                        show={successEverified}
                        backdrop="static"
                        keyboard={false}
                        onHide={false}
                    >
                        <Modal.Header closeButton onClick={() => statesDeleted()}>
                            <Modal.Title>E-Verification Successful!!</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            Congratulations, You have successfully E-verified your ITR Return.
                        </Modal.Body>
                        <Modal.Footer>

                            <Button variant="success" onClick={() => downloadItr(ackNo)}>
                                Download ITR
                            </Button>
                            <Button variant="success" onClick={() => downloadAckForm(ackNo)}>Download Acknowledgement Form</Button>
                        </Modal.Footer>
                    </Modal>
                ) : <div></div>}

            <div className="mt-5">

                {showSpinner ?
                    (

                        <div className=" d-flex align-items-center justify-content-center mb-5">

                            <div className="mt-5">

                                <Spinner size="xxl" className="cover-spin" animation="grow" variant="warning" />
                                <Spinner size="xxl" className="cover-spin" animation="grow" variant="danger" />
                                <Spinner size="xxl" className="cover-spin" animation="grow" variant="primary" />
                                <Spinner size="xxl" className="cover-spin" animation="grow" variant="warning" />
                                <Spinner size="xxl" className="cover-spin" animation="grow" variant="danger" />
                                <Spinner size="xxl" className="cover-spin" animation="grow" variant="primary" />
                                <Spinner size="xxl" className="cover-spin" animation="grow" variant="warning" />
                                <Spinner size="xxl" className="cover-spin" animation="grow" variant="danger" />
                                <Spinner size="xxl" className="cover-spin" animation="grow" variant="primary" />
                            </div>
                        </div>)
                    : <div></div>}

                <Form>
                    <Form.Group className="mb-3 mw-100" controlId="formBasicEmail">
                        <Form.Label>PAN Number</Form.Label>
                        <Form.Control className="p-3" type="text" placeholder="Enter Your PAN Number" onChange={(e) => { setPan(e.target.value) }} value={pan} />
                    </Form.Group>

                    <Form.Group className="mb-3 mw-100">
                        <Form.Label htmlFor="enabledSelect">Select Your Assessment Year</Form.Label>
                        <Form.Select className="p-3" id="enabledSelect" value={assYr} onChange={(e)=>setAssYr(e.target.value)}>
                            <option disabled value="">Select Your Assessment Year</option>
                            <option value="2019">2019-20</option>
                            <option value='2020'>2020-21</option>
                            <option value='2021'>2021-22</option>
                            <option value='2022'>2022-23</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3 mw-100" controlId="formBasicPassword">
                        <Form.Label>Acknowledgement Number</Form.Label>
                        <Form.Control className="p-3" type="text" placeholder="Enter Your Acknowledgement Number" onChange={(e) => setAckNo(e.target.value)} value={ackNo} />
                        {wrongAckNoAlert ?
                            (
                                <div className="container mt-3">
                                    <Alert variant="danger" onClose={() => setWrongAckNoAlert(false)} dismissible>
                                        <Alert.Heading>No Records Found For The Given Acknowledgement Number...</Alert.Heading>
                                        <p>
                                            This could be also possible if you have selected the wrong assessment year.
                                        </p>
                                    </Alert>
                                </div>

                            )
                            : <div></div>}
                    </Form.Group>
                    <Button className="mt-2" variant="primary" type="submit" onClick={(e) => submitDetails(e, assYr, pan, ackNo)}>
                        Submit
                    </Button>
                    <Button className="mx-3 mt-2" variant="danger" type="reset" value="Reset">
                        Reset
                    </Button>
                </Form>

            </div>

            {showOtpModal ?
                (<Modal show={showOtpModal} fullscreen={true} onHide={false} >
                    <Modal.Header >
                        <Modal.Title>Enter The Otp Recieved On Aadhaar Registered Number</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>

                        {showSpinner ?
                            (

                                <div className=" d-flex align-items-center justify-content-center mb-5">

                                    <div className="mt-5">
                                        <Spinner size="xxl" className="cover-spin" animation="grow" variant="warning" />
                                        <Spinner size="xxl" className="cover-spin" animation="grow" variant="danger" />
                                        <Spinner size="xxl" className="cover-spin" animation="grow" variant="primary" />
                                        <Spinner size="xxl" className="cover-spin" animation="grow" variant="warning" />
                                        <Spinner size="xxl" className="cover-spin" animation="grow" variant="danger" />
                                        <Spinner size="xxl" className="cover-spin" animation="grow" variant="primary" />
                                        <Spinner size="xxl" className="cover-spin" animation="grow" variant="warning" />
                                        <Spinner size="xxl" className="cover-spin" animation="grow" variant="danger" />
                                        <Spinner size="xxl" className="cover-spin" animation="grow" variant="primary" />
                                    </div>
                                </div>)
                            : <div></div>}

                        <Form>

                            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                                <Form.Label>Enter The OTP</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Enter the 6-digit OTP"
                                    autoFocus
                                    onChange={(e) => setOtp(e.target.value)}
                                    value={otp}
                                />
                            </Form.Group>

                        </Form>
                    </Modal.Body>
                    <Modal.Footer>

                        <Button variant="primary" onClick={() => validateOtp(aadhaarTxnId, ackNo, pan, otp)} >
                            Validate
                        </Button>
                    </Modal.Footer>
                </Modal>)
                : <div></div>}

        </div>


    )
}

export default AcknowledgementForm;