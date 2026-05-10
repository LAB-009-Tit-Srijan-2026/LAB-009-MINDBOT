import Hero from "./sections/Hero";
import About from "./sections/About";
import Features from "./sections/Features";
import Showcase from "./sections/Showcase";
import Pricing from "./sections/Pricing";
import Footer from "./sections/Footer";

export default function App() {
  return (
    <main className="flex flex-col bg-black min-h-screen">
      <Hero />
      <About />
      <Features />
      <Showcase />
      <Pricing />
      <Footer />
    </main>
  );
}
