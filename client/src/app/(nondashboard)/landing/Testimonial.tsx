"use client"
import React, { useEffect, useRef } from 'react';
import { Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from "swiper/react";
import 'swiper/css';
import 'swiper/css/pagination';
import { HiStar } from 'react-icons/hi';
import { motion, useAnimation, useInView } from "framer-motion";
import client1 from "../assets/images/patient-avatar.png";
import client2 from "../assets/images/client2.jpg";
import client3 from "../assets/images/client3.jpg";
import client4 from "../assets/images/client4.jpg";
import client5 from "../assets/images/client3.jpg";
import Image from 'next/image';

const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5
    }
  },
};

// Array of testimonials
const testimonials = [
    {
      imageUrl: client1,
      name: "Emily Johnson",
      rating: 5,
      comment: "Working with this team was a dream! They helped me find the perfect home in a great neighborhood. Highly recommend their services!",
    },
    {
      imageUrl: client2,
      name: "Michael Brown",
      rating: 4,
      comment: "The process of selling my property was smooth and stress-free. The team was professional and always available to answer my questions.",
    },
    {
      imageUrl: client3,
      name: "Sarah Lee",
      rating: 5,
      comment: "I found my dream apartment thanks to their expertise. They really listened to my needs and found exactly what I was looking for.",
    },
    {
      imageUrl: client4,
      name: "David Martinez",
      rating: 3,
      comment: "Good experience overall, but there were a few delays in the paperwork. Still, I'm happy with the property I purchased.",
    },
    {
      imageUrl: client5,
      name: "Jessica Taylor",
      rating: 5,
      comment: "Amazing service! They went above and beyond to help me rent out my property quickly and at a great price.",
    },
  ];

const Testimonial = () => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    } else {
      controls.start("hidden");
    }
  }, [controls, isInView]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={containerVariants}
      className="mt-10 py-14 lg:mt-[55px] mb-52 px-10"
    >
      <Swiper
        modules={[Pagination]}
        spaceBetween={30}
        slidesPerView={1}
        pagination={{ clickable: true }}
        breakpoints={{
          640: {
            slidesPerView: 1,
            spaceBetween: 0,
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 30,
          },
        }}
      >
        {testimonials.map((testimonial, index) => (
          <SwiperSlide key={index}>
            <motion.div 
              variants={itemVariants}
              className="py-[30px] px-5 rounded-3 bg-white shadow-md"
            >
              <div className="flex items-center gap-[13px]">
                <Image className='h-16 w-16 rounded-lg object-cover' src={testimonial.imageUrl} alt={`${testimonial.name} Avatar`} />
                <div>
                  <h4 className="text-[18px] leading-[30px] font-semibold text-headingColor">
                    {testimonial.name}
                  </h4>
                  <div className="flex items-center gap-[2px]">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <HiStar key={i} className='text-red-400 w-[18px] h-5' />
                    ))}
                  </div>
                </div>
              </div>
              <p className='leading-7 mt-4 text-textColor font-[400]'>
                {testimonial.comment}
              </p>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>
    </motion.div>
  );
};

export default Testimonial;