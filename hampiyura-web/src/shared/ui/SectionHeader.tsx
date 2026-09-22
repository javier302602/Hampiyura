import { ReactNode } from 'react';

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

function SectionHeader({ eyebrow, title, description, action }: Props) {
  return (
    <div className="section-header">
      <div className="section-header-text">
        {eyebrow && <p className="section-header-eyebrow">{eyebrow}</p>}
        <h2 className="section-header-title">{title}</h2>
        {description && <p className="section-header-desc">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export default SectionHeader;
