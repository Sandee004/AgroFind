import { Camera, Send } from "lucide-react";
import { ChangeEvent, useState, useEffect, useRef } from "react";
import Loader from "./loader";

interface Message {
  type: "sent" | "received" | "error";
  content: string;
}

const Home = () => {
  /*
  const [isSentMsgVisible, setIsSentMsgVisible] = useState(false);
  const [analysisData, setAnalysisData] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState("");*/

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImgSelected, setIsImgSelected] = useState<boolean>(false);
  const [previewSrc, setPreviewSrc] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const handleImgChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target && typeof e.target.result === "string") {
          setPreviewSrc(e.target.result);
          setIsImgSelected(true);
        }
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };
  /*const handleImgChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target && typeof e.target.result === "string") {
          setPreviewSrc(e.target.result);
          setIsImgSelected(true);
          setSentMessage(e.target.result);
        }
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendImage = async () => {
    setIsSentMsgVisible(true);
    try {
      setIsLoading(true);
      const fileInput = document.getElementById(
        "fileInput"
      ) as HTMLInputElement;
      if (!fileInput.files || !fileInput.files[0]) {
        throw new Error("No file selected");
      }

      const formData = new FormData();
      formData.append("image", fileInput.files[0]);

      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data.analysis);
      setAnalysisData(data.analysis);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsImgSelected(false);
      setPreviewSrc("");
    }
  };*/

  const sendImage = async () => {
    if (isImgSelected) {
      try {
        setIsLoading(true);
        const fileInput = document.getElementById(
          "fileInput"
        ) as HTMLInputElement;
        if (!fileInput.files || !fileInput.files[0]) {
          throw new Error("No file selected");
        }

        // Add the sent image to messages
        const newMessage: Message = {
          type: "sent",
          content: previewSrc,
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]);

        const formData = new FormData();
        formData.append("image", fileInput.files[0]);

        const response = await fetch("http://localhost:5000/analyze", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle specific error for unsupported file type
          if (response.status === 400 && data.error) {
            throw new Error(data.error);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Add the received analysis to messages
        const responseMessage: Message = {
          type: "received",
          content: data.analysis,
        };
        setMessages((prevMessages) => [...prevMessages, responseMessage]);
      } catch (e) {
        console.error(e);
        // Optionally, add an error message to the chat
        const errorMessage: Message = {
          type: "error",
          content:
            e instanceof Error
              ? e.message
              : "An unknown error occurred while analyzing the image.",
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      } finally {
        setIsLoading(false);
        setIsImgSelected(false);
        setPreviewSrc("");
      }
    }
  };

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-opacity-90 flex flex-col">
      {isLoading && <Loader />}
      <div className="backdrop-blur-md bg-green-300 py-3 fixed w-full">
        <p className="font-bold text-2xl text-center">AgroFind</p>
      </div>

      <div className="flex-1 mt-16 pb-20 overflow-hidden">
        <div
          id="chatArea"
          ref={chatAreaRef}
          className="h-full overflow-y-auto p-4 space-y-6"
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.type === "sent" ? "justify-end" : "justify-start"
              }`}
            >
              {message.type === "sent" ? (
                <img
                  src={message.content}
                  className="w-48 h-auto rounded-lg shadow-md"
                  alt="Sent"
                />
              ) : (
                <div
                  className={`p-3 rounded-lg shadow-md max-w-xs ${
                    message.type === "error"
                      ? "bg-red-100 text-red-700"
                      : "bg-white text-black"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 w-full py-2 bg-green-300 border-t">
        <div className="flex justify-between mx-5 items-center">
          <div id="previewContainer" className={isImgSelected ? "" : "hidden"}>
            <img
              id="imagePreview"
              className="w-12 h-12 object-cover rounded-full"
              src={previewSrc}
              alt="Preview"
            />
          </div>

          <div className="relative">
            <label
              htmlFor="fileInput"
              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors cursor-pointer inline-block"
            >
              <Camera size={24} />
            </label>
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImgChange}
            />
          </div>

          <button
            id="sendButton"
            className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            disabled={!isImgSelected || isLoading}
            onClick={sendImage}
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
