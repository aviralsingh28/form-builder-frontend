import { QuestionType, FormSettings } from "./api/types";

export interface TemplateQuestion {
  title: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  description?: string;
  media?: Array<{
    url: string;
    key: string;
    originalName: string;
    mimeType: string;
    size: number;
  }>;
}

export interface Template {
  title: string;
  description: string;
  theme?: FormSettings["theme"];
  questions: TemplateQuestion[];
}

export const TEMPLATES: Record<string, Template> = {
  contact: {
    title: "Contact Information",
    description: "Please fill out your contact details.",
    theme: {
      themeColor: "#0f9d58",
      backgroundColor: "#e8f5e9",
      headerImage: "/templates/contact.png",
    },
    questions: [
      { title: "Name", type: "SHORT_TYPE", required: true },
      { title: "Email", type: "SHORT_TYPE", required: true },
      { title: "Address", type: "LONG_TYPE", required: false },
      { title: "Phone number", type: "SHORT_TYPE", required: false },
      { title: "Comments", type: "LONG_TYPE", required: false },
    ],
  },
  rsvp: {
    title: "Event RSVP",
    description: "Event Address: 123 Your Street Your City, ST 12345\nContact us at (123) 456-7890 or no_reply@example.com.",
    theme: {
      themeColor: "#e67e22",
      backgroundColor: "#fff7ed",
      headerImage: "/templates/rsvp.png",
    },
    questions: [
      {
        title: "Can you attend?",
        type: "SINGLE_CHOICE",
        required: true,
        options: ["Yes, I'll be there", "Sorry, can't make it"],
      },
      {
        title: "What are the names of people attending?",
        type: "LONG_TYPE",
        required: false,
      },
      {
        title: "How did you hear about this event?",
        type: "SINGLE_CHOICE",
        required: false,
        options: ["Website", "Friend", "Newsletter", "Advertisement"],
      },
      {
        title: "Comments and/or questions",
        type: "LONG_TYPE",
        required: false,
      },
    ],
  },
  shirt: {
    title: "T-Shirt Sign Up",
    description: "Enter your name and select your t-shirt size.",
    theme: {
      themeColor: "#673ab7",
      backgroundColor: "#f3e5f5",
      headerImage: "/templates/shirt.png",
    },
    questions: [
      { title: "Name", type: "SHORT_TYPE", required: true },
      {
        title: "Shirt size",
        type: "CHECKBOXES",
        required: true,
        options: ["XS", "S", "M", "L", "XL", "XXL"],
      },
      {
        title: "T-shirt Preview",
        type: "IMAGE",
        required: false,
        description: "Preview of our official event t-shirt.",
        media: [
          {
            url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
            key: "dummy-tshirt",
            originalName: "tshirt.jpg",
            mimeType: "image/jpeg",
            size: 102400,
          },
        ],
      },
      {
        title: "Other thoughts or comments",
        type: "LONG_TYPE",
        required: false,
      },
    ],
  },
  quiz: {
    title: "Blank Quiz",
    description: "A simple quiz template.",
    theme: {
      themeColor: "#673ab7",
      backgroundColor: "#f3e5f5",
    },
    questions: [
      {
        title: "Untitled Question",
        type: "SINGLE_CHOICE",
        required: false,
        options: ["Option 1"],
      },
    ],
  },
};
