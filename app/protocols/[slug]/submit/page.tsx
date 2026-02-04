"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

const steps = [
  { id: 1, name: "Details", description: "Describe the vulnerability" },
  { id: 2, name: "Severity", description: "Rate the impact" },
  { id: 3, name: "Evidence", description: "Upload proof" },
  { id: 4, name: "Impact", description: "Explain consequences" },
  { id: 5, name: "Review", description: "Submit report" },
];

export default function SubmitPage() {
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "medium",
    evidence: "",
    impact: "",
    files: null as FileList | null,
  });

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    // Encrypt and submit
    console.log("Submitting:", formData);
    alert("Submission created! (Demo)");
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Submit Finding</h1>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step.id <= currentStep
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {step.id}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-full h-1 mx-2 ${
                      step.id < currentStep ? "bg-indigo-600" : "bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            {steps.map((step) => (
              <span key={step.id}>{step.name}</span>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Finding Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Brief description of the vulnerability"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Detailed description of the vulnerability..."
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Severity</h2>
              <div className="space-y-2">
                {["critical", "high", "medium", "low"].map((sev) => (
                  <label
                    key={sev}
                    className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                      formData.severity === sev
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-gray-600 hover:border-gray-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="severity"
                      value={sev}
                      checked={formData.severity === sev}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                      className="sr-only"
                    />
                    <span className={`capitalize font-medium ${
                      sev === "critical" ? "text-red-400" :
                      sev === "high" ? "text-orange-400" :
                      sev === "medium" ? "text-yellow-400" : "text-green-400"
                    }`}>
                      {sev}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Evidence</h2>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Proof of Concept</label>
                <textarea
                  value={formData.evidence}
                  onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                  rows={6}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="// Paste your PoC code here..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Attachments</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFormData({ ...formData, files: e.target.files })}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Impact</h2>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Impact Assessment</label>
                <textarea
                  value={formData.impact}
                  onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe the potential impact of this vulnerability..."
                />
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Review</h2>
              <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                <p><span className="text-gray-400">Title:</span> <span className="text-white">{formData.title || "Not set"}</span></p>
                <p><span className="text-gray-400">Severity:</span> <span className="text-white capitalize">{formData.severity}</span></p>
                <p><span className="text-gray-400">Description:</span> <span className="text-white">{formData.description ? "✓ Set" : "Not set"}</span></p>
                <p><span className="text-gray-400">Evidence:</span> <span className="text-white">{formData.evidence ? "✓ Set" : "Not set"}</span></p>
                <p><span className="text-gray-400">Impact:</span> <span className="text-white">{formData.impact ? "✓ Set" : "Not set"}</span></p>
              </div>
              <p className="text-sm text-gray-400">
                This submission will be encrypted before sending to the protocol team.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>
            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors"
              >
                Submit Finding
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}