import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PageNotFound = () => {
  return (
    <>
      <h1>Page Not Found!</h1>
      <Link to={"/"}>
        <button className="not-found-btn">
            <ArrowLeft size={16} />
            Back to Dashboard
        </button>
      </Link>
    </>
  )
}

export default PageNotFound;