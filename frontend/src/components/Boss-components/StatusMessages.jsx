import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const StatusMessages = ({ successMessage, failureMessage }) => {
  return (
    <div className="h-12 mb-6 max-w-3xl mx-auto text-center">
      {failureMessage && (
        <div className="p-3 bg-red-900 border border-red-700 text-red-300 rounded-lg shadow-md flex items-center justify-center animate-fade-in text-sm">
          <FaTimesCircle className="mr-2" /> {failureMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="p-3 bg-green-900 border border-green-700 text-green-300 rounded-lg shadow-md flex items-center justify-center animate-fade-in text-sm">
          <FaCheckCircle className="mr-2" /> {successMessage}
        </div>
      )}
    </div>
  );
};

export default StatusMessages;