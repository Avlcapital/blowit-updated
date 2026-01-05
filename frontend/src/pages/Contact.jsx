import React, { useState } from "react";
import Layout from "../components/Layout.jsx";
import "../styles/Contact.css";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaPaperPlane, FaComments } from "react-icons/fa";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Message sent successfully!");
    setFormData({ name: "", email: "", message: "" });
  };

  const handleChatSend = () => {
    if (chatInput.trim() === "") return;
    setChatMessages([...chatMessages, { sender: "user", text: chatInput }]);
    setChatInput("");

    // Simulated bot response (can connect to AI later)
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Thank you for reaching out. Our support team will get back to you soon." },
      ]);
    }, 800);
  };

  return (
    <Layout>
      <section className="contact-section">
        <div className="contact-container">
          <h1>Contact Us</h1>
          <p>
            Have questions or need assistance? We’re here to help you with inquiries about imports, financing, or support.
          </p>

          {/* Contact Info */}
          <div className="contact-info">
            <div className="info-box">
              <FaPhoneAlt className="info-icon" />
              <p>+254202304180</p>
            </div>
            <div className="info-box">
              <FaEnvelope className="info-icon" />
              <p>info@blowitafrica.com</p>
            </div>
            <div className="info-box">
              <FaMapMarkerAlt className="info-icon" />
              <p>Lower duplex Apartments, UpperHill</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-form">
            <h2>Send Us a Message</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <textarea
                name="message"
                rows="5"
                placeholder="Your Message"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
              <button type="submit">
                <FaPaperPlane /> Send Message
              </button>
            </form>
          </div>
        </div>

        {/* Floating Chatbot */}
        <div className={`chatbot-container ${chatOpen ? "open" : ""}`}>
          {chatOpen ? (
            <div className="chatbox">
              <div className="chatbox-header">
                <h4>Blowit Support</h4>
                <span onClick={() => setChatOpen(false)}>&times;</span>
              </div>
              <div className="chatbox-body">
                {chatMessages.length === 0 ? (
                  <p className="chat-placeholder">Start a conversation with us!</p>
                ) : (
                  chatMessages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.sender}`}>
                      <p>{msg.text}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="chatbox-footer">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                />
                <button onClick={handleChatSend}>
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          ) : (
            <button className="chat-toggle" onClick={() => setChatOpen(true)}>
              <FaComments />
            </button>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
