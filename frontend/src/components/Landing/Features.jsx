import React from 'react'
import MagicBento from '../ui/MagicBento'
const Features = () => {
  return (
    <section className="px-4 py-8">
      <h2 className="max-w-[900px] mx-auto text-3xl sm:text-4xl font-semibold text-center mb-6">
        Empowering Student Finances
      </h2>
      <MagicBento 
        textAutoHide={true}
        enableStars={true}
        enableSpotlight={true}
        enableBorderGlow={true}
        enableTilt={true}
        enableMagnetism={true}
        clickEffect={true}
        spotlightRadius={300}
        particleCount={12}
        glowColor="132, 0, 255"
      />
    </section>
  )
}

export default Features;
