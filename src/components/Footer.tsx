import { FaGithub } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="w-full bg-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col items-center text-sm text-gray-600 space-y-2">
        <a
          href="https://github.com/ananya-sh30/Schedulr.git"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-indigo-600"
        >
          <FaGithub className="text-lg" />
          <span>View on GitHub</span>
        </a>
        <p>
          ❤️ Made by{" "}
          <a
            href="https://www.linkedin.com/in/ananya-sharma-8251b1288"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 hover:underline"
          >
            Ananya Sharma
          </a>

        </p>
        
      </div>
    </footer>
  );
};

export default Footer;
