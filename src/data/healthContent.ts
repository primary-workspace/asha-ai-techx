import { AlertTriangle, Apple, Baby, Droplets, Moon, Sun } from 'lucide-react';

export const NUTRITION_ADVICE = [
  {
    id: 'iron',
    title: 'Fight Anemia ( खून की कमी )',
    items: ['Jaggery (Gur)', 'Spinach (Saag)', 'Liver', 'Dates'],
    color: 'bg-red-100 text-red-800',
    icon: Droplets
  },
  {
    id: 'protein',
    title: 'Strength ( ताकत )',
    items: ['Dal (Lentils)', 'Chana (Chickpeas)', 'Eggs', 'Milk'],
    color: 'bg-orange-100 text-orange-800',
    icon: Sun
  },
  {
    id: 'vitamins',
    title: 'Immunity ( बचाव )',
    items: ['Citrus Fruits', 'Papaya (Ripe)', 'Carrots', 'Green Veggies'],
    color: 'bg-green-100 text-green-800',
    icon: Apple
  }
];

export const EDUCATION_TOPICS = [
  {
    id: 'danger_signs',
    title: 'Danger Signs',
    subtitle: 'खतरे के संकेत',
    icon: AlertTriangle,
    color: 'bg-red-50 border-red-200',
    content: [
      'Severe headache or blurry vision',
      'Swelling of hands and face',
      'Severe belly pain',
      'Bleeding or leaking fluid'
    ]
  },
  {
    id: 'hygiene',
    title: 'Hygiene',
    subtitle: 'साफ - सफाई',
    icon: Droplets,
    color: 'bg-blue-50 border-blue-200',
    content: [
      'Wash hands before eating',
      'Use clean cloth/pads during periods',
      'Bathe daily',
      'Wear clean clothes'
    ]
  },
  {
    id: 'rest',
    title: 'Rest & Sleep',
    subtitle: 'आराम',
    icon: Moon,
    color: 'bg-indigo-50 border-indigo-200',
    content: [
      'Sleep 8 hours at night',
      'Rest 2 hours in the day',
      'Lie on your left side',
      'Avoid heavy lifting'
    ]
  },
  {
    id: 'baby',
    title: 'Baby Growth',
    subtitle: 'शिशु विकास',
    icon: Baby,
    color: 'bg-pink-50 border-pink-200',
    content: [
      'Baby hears your voice now',
      'Kick counts matter',
      'Talk to your baby',
      'Prepare clean clothes'
    ]
  }
];
