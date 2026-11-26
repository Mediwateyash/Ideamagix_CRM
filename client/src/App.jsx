import { useEffect,useState } from "react";
import API from "./services/api"

function App(){
  const[message,setMessage] = useState("")
  const[loading , setLoading]=useState(true)

  useEffect(()=>{
    const fetchBackend=async()=>{
      try{
        const response=await API.get("/")
        setMessage(response.data);
      }
      catch(error){
        console.error("backend connection failed",error)
        setMessage("Backend connection failed")
      }finally{
        setLoading(false)
      }
    }
    fetchBackend()
  },[]);

  return(
    <div className="min-h-screen flex iteam-centre justify-centre bg-slate-100">
      <div className="bg-white p-10 rounded-2x1 shadow-lg text-centre">
        <h1 className="text-2xl font-bold text-blue-900">
          Ideamagix CRM
        </h1>
        <p className="mt-4 text-gray-600">
          { loading? "connecting..." : message}
        </p>
      </div>
    </div>
  )
}

export default App