// axios.js
import axios from "axios";

export default axios.create({
  baseURL: "https://localhost:7024",
  headers: { 
      'Content-Type': 'application/json-patch+json', 
      'Accept': '*/*' 
    }
  })