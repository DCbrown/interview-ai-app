import React, { useEffect, useState } from "react";
import Chat from "./Chat";
import { fetchOpenAIResponse } from "../utils/fetchOpenAIResponse";
import RequestForm from "./RequestForm";

const ResumeUploader = () => {
  const [showChat, setShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialText, setInitialText] = useState<string>();
  const [interviewData, setInterviewData] = useState({
    jobDescriptionText: "",
    interviewType: "",
    resumeText: "",
  });

  useEffect(() => {
    const startInterview = async (text: string) => {
      const messageToSend = `INTERVIEW TYPE: ${interviewData.interviewType}
------------
RESUME: ${text}
------------
JOB DESCRIPTION: ${interviewData.jobDescriptionText}
------------`;
      await fetchOpenAIResponse(
        [{ role: "user", content: messageToSend }],
        (msg) => setInitialText(msg)
      );
    };

    if (
      isLoading &&
      interviewData.resumeText !== "" &&
      interviewData.resumeText !== undefined
    ) {
      startInterview(interviewData.resumeText).then(() => {
        setIsLoading(false);
        setShowChat(true);
      });
    }
  }, [interviewData.resumeText]);

  return (
    <div className="form-wrapper">
      {!isLoading ? (
        <p className="instructions-text">
          {!showChat
            ? "Please fill out the form requirements to start the interview process"
            : "Interviewer Log"}
        </p>
      ) : (
        ""
      )}
      {!showChat ? (
        <div className="request-form-wrapper">
          {!isLoading ? (
            <RequestForm
              interviewData={interviewData}
              setIsLoading={setIsLoading}
              setInterviewData={setInterviewData}
            />
          ) : (
            ""
          )}
          {isLoading && (
            <div>
              <div className="loading-spinner"></div>
              <p className="loading-txt">Loading...</p>
            </div>
          )}
        </div>
      ) : (
        <Chat initialText={initialText} interviewData={interviewData} />
      )}
    </div>
  );
};

export default ResumeUploader;
