import React, { useState } from "react";
import type { TextContent, TextItem } from "pdfjs-dist/types/src/display/api";

type InterviewData = {
  jobDescriptionText: string;
  interviewType: string;
  resumeText: string;
};

type Props = {
  interviewData: InterviewData;
  setInterviewData: React.Dispatch<React.SetStateAction<InterviewData>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const RequestForm: React.FC<Props> = ({
  interviewData,
  setInterviewData,
  setIsLoading,
}) => {
  const { interviewType } = interviewData;
  const [jobDescriptionUrl, setJobDescriptionUrl] = useState("");
  const [errors, setErrors] = useState<{
    jobDescription?: string;
    interviewType?: string;
  }>({});

  const mergeTextContent = (textContent: TextContent) => {
    return textContent.items
      .map((item) => {
        const { str, hasEOL } = item as TextItem;
        return str + (hasEOL ? "\n" : "");
      })
      .join("");
  };

  const readResume = async (pdfFile: File | undefined) => {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

    if (!pdfFile) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result;
      if (arrayBuffer && arrayBuffer instanceof ArrayBuffer) {
        const loadingTask = pdfjs.getDocument(new Uint8Array(arrayBuffer));
        loadingTask.promise.then(
          (pdfDoc) => {
            pdfDoc.getPage(1).then((page) => {
              page.getTextContent().then((textContent) => {
                const extractedText = mergeTextContent(textContent);
                setInterviewData((data) => ({
                  ...data,
                  resumeText: extractedText,
                }));
              });
            });
          },
          (reason) => {
            console.error(`Error during PDF loading: ${reason}`);
          }
        );
      }
    };
    reader.readAsArrayBuffer(pdfFile);
  };

  const scrapeJobDescription = async (url: string) => {
    const response = await fetch(`/api/scrapper`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });
    const responseData = await response.json();
    setInterviewData((data) => ({
      ...data,
      jobDescriptionText: responseData.textContent,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: { jobDescription?: string; interviewType?: string } = {};
    let isValid = true;

    if (!jobDescriptionUrl.trim()) {
      newErrors.jobDescription = "Please enter a job description URL";
      isValid = false;
    }

    if (!interviewType) {
      newErrors.interviewType = "Please select an interview type";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleResumeUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!validateForm()) {
      event.target.value = ""; // Reset file input
      return;
    }

    setIsLoading(true);
    setInterviewData((data) => ({
      ...data,
      resumeText: "",
    }));
    const file = event.target.files?.[0];
    if (!file) {
      console.error("No file selected");
      setIsLoading(false);
      return;
    }
    await scrapeJobDescription(jobDescriptionUrl);
    await readResume(file);
  };

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="job-input" className="text-center block w-full">
          Job Description
        </label>
        <input
          className={`input-style text-center placeholder:text-center ${
            errors.jobDescription ? "border-red-500" : ""
          }`}
          name="job-input"
          type="url"
          placeholder="Drop the url here"
          value={jobDescriptionUrl}
          onChange={(e) => {
            setJobDescriptionUrl(e.target.value);
            setErrors((prev) => ({ ...prev, jobDescription: undefined }));
          }}
          style={{ textAlign: "center" }}
        />
        {errors.jobDescription && (
          <p className="text-red-500 text-sm mt-1 text-center">
            {errors.jobDescription}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="interview-type" className="text-center block w-full">
          Interview Type
        </label>
        <select
          className={`input-style text-center ${
            errors.interviewType ? "border-red-500" : ""
          }`}
          name="interview-type"
          value={interviewType}
          onChange={(e) => {
            setInterviewData((data) => ({
              ...data,
              interviewType: e.target.value,
            }));
            setErrors((prev) => ({ ...prev, interviewType: undefined }));
          }}
          style={{ textAlign: "center" }}
        >
          <option value="">Select Interview Type</option>
          <option value="behavioral">Behavioral</option>
          <option value="leetcode">Leetcode</option>
          <option value="project">Project</option>
        </select>
        {errors.interviewType && (
          <p className="text-red-500 text-sm mt-1 text-center">
            {errors.interviewType}
          </p>
        )}
      </div>

      <div className="file-upload-btn-container">
        <input
          type="file"
          id="file-upload"
          onChange={handleResumeUpload}
          accept="application/pdf"
          hidden
        />
        <label htmlFor="file-upload" className="label-style bg-blue-500">
          Upload Resume
        </label>
      </div>
    </div>
  );
};

export default RequestForm;
