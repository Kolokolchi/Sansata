import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { AboutSection } from '../components/AboutSection';
import { GallerySection } from '../components/GallerySection';
import { LocationNarrativeSection } from '../components/LocationNarrativeSection';
import { PrivacySection } from '../components/PrivacySection';
import { FlatsShowcaseSection } from '../components/FlatsShowcaseSection';
import { BenefitsSection } from '../components/BenefitsSection';
import { FinishingHotspotsSection } from '../components/FinishingHotspotsSection';
import { LocationMapSection } from '../components/LocationMapSection';
import { PromosSection } from '../components/PromosSection';
import { MortgageCalculatorSection } from '../components/MortgageCalculatorSection';
import { HowToBuySection } from '../components/HowToBuySection';
import { ProgressSection } from '../components/ProgressSection';
import { DocsSection } from '../components/DocsSection';
import { ContactsSection } from '../components/ContactsSection';

export const HomePage: React.FC = () => {
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <GallerySection />
      <LocationNarrativeSection />
      <PrivacySection />
      <FlatsShowcaseSection />
      <BenefitsSection />
      <FinishingHotspotsSection />
      <LocationMapSection />
      <PromosSection />
      <MortgageCalculatorSection />
      <HowToBuySection />
      <ProgressSection />
      <DocsSection />
      <ContactsSection />
    </main>
  );
};
