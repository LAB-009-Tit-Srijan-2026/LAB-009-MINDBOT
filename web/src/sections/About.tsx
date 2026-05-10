import WordsPullUpMultiStyle from '../components/WordsPullUpMultiStyle';
import ScrollRevealText from '../components/ScrollRevealText';
import './sections.css';

export default function AboutSection() {
  const headingSegments = [
    { text: 'Built on RAG architecture,', className: 'font-normal' },
    { text: 'with Deepgraph, Voyage AI embeddings.', className: 'about-heading-italic' },
    { text: 'turn long video lectures into instant knowledge.', className: 'font-normal' },
  ];

  const bodyText =
    "ATHEX turns any lecture video into an intelligent AI companion. Ask questions directly from your lecture. Get timestamped answers. Skip to exactly what you need — instantly.";

  return (
    <section id="about" className="about-section">
      <div className="about-inner-card">
        <div className="about-container">
          {/* Label */}
          <p className="about-label">
            AI  EDUCATION
          </p>

          {/* Multi-style heading */}
          <div className="about-heading">
            <WordsPullUpMultiStyle
              segments={headingSegments}
              containerClassName="justify-center"
            />
          </div>

          {/* Scroll-reveal paragraph — centered */}
          <div className="about-body">
            <ScrollRevealText
              text={bodyText}
              className="about-body-text"
            />
          </div>
        </div>
      </div>
    </section>
  );
}