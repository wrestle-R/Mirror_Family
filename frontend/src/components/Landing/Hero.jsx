"use client";

import { ArrowRight } from "lucide-react";
import Navbar from "./Navbar";
import { useTheme } from "@/context/ThemeContext";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Gradient background with grain effect */}
      <div
        className="flex flex-col items-end absolute -right-60 -top-10 blur-xl z-0 ">
        <div
          className="h-[10rem] rounded-full w-[60rem] z-1 blur-[6rem]"
          style={{
            background: theme === 'dark' 
              ? 'linear-gradient(to bottom, #8b5cf6, #06b6d4)'
              : 'linear-gradient(to bottom, #a855f7, #0ea5e9)'
          }}></div>
        <div
          className="h-[10rem] rounded-full w-[90rem] z-1 blur-[6rem]"
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(to bottom, #ec4899, #fbbf24)'
              : 'linear-gradient(to bottom, #e879f9, #f59e0b)'
          }}></div>
        <div
          className="h-[10rem] rounded-full w-[60rem] z-1 blur-[6rem]"
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(to bottom, #f59e0b, #0ea5e9)'
              : 'linear-gradient(to bottom, #fb923c, #3b82f6)'
          }}></div>
      </div>
      <div className="absolute inset-0 z-0 bg-noise opacity-30"></div>
      {/* Content container */}
      <div className="relative z-10">
        <Navbar />

        {/* Badge */}
        <div
          className="mx-auto mt-24 md:mt-40 lg:mt-40 flex max-w-fit items-center justify-center space-x-2 rounded-full bg-card/10 px-4 py-2 backdrop-blur-sm border border-border/20">
          <span className="text-sm md:text-base font-medium text-foreground">
            Democratizing financial literacy
          </span>
          <ArrowRight className="h-4 w-4 text-foreground" />
        </div>

        {/* Hero section */}
        <div className="container mx-auto mt-6 px-4 text-center">
          <h1
            className="mx-auto max-w-4xl text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-foreground">
            Master Your Finances with MoneyCouncil
          </h1>
          <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground">
            A secure, student-focused platform to track expenses, save efficiently, and learn financial skills for life.
          </p>
          <div
            className="mt-8 sm:mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <button
              onClick={() => navigate('/auth')}
              className="h-12 sm:h-14 rounded-full bg-primary px-8 sm:px-10 text-base sm:text-lg font-medium text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl">
              Start Your Journey
            </button>
            <button
              onClick={() => navigate('/about')}
              className="h-12 sm:h-14 rounded-full bg-secondary px-8 sm:px-10 text-base sm:text-lg font-medium text-secondary-foreground hover:bg-secondary/90 transition-all duration-200 border border-border shadow-md hover:shadow-lg">
              Learn More
            </button>
          </div>

          <div className="relative mx-auto my-12 sm:my-16 md:my-20 w-full max-w-6xl">
            <div
              className="absolute inset-0 rounded shadow-lg bg-card blur-[10rem] bg-grainy opacity-20" />

            {/* Hero Image - Switches based on theme */}
            <img
              src={
                theme === 'dark'
                  ? "/dark mode.jpeg" 
                  : "/light mode.jpeg" 
              }
              alt={`Dashboard Interface - ${theme === 'dark' ? 'Dark' : 'Light'} Mode`}
              className="relative w-full h-auto shadow-md rounded border border-border transition-all duration-500"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
