import { MapPinOff } from "lucide-react";
import { Link } from "react-router-dom";
import { Empty } from "../components/ui";

export default function NotFound() {
  return <div className="py-20"><Empty icon={MapPinOff} title="Page not found" text="The page you're looking for doesn't exist on this map." action={<Link to="/" className="btn-primary">Go home</Link>} /></div>;
}
