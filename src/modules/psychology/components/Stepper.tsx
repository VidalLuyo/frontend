import React from 'react';

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="mb-8">
      <ol className="flex items-center w-full">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <li 
              key={index} 
              className={`flex items-center ${
                index !== steps.length - 1 ? 'w-full' : ''
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : isCurrent
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-gray-300 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <span className={`mx-2 text-sm font-medium ${
                  isCurrent ? 'text-indigo-600' : 'text-gray-500'
                }`}>
                  {step}
                </span>
              </div>
              {index !== steps.length - 1 && (
                <div className={`flex-auto h-1 ${
                  stepNumber < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                }`}></div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};