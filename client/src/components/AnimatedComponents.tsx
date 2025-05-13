import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Card, Typography, CardMedia, CardContent, CardActions, Paper, alpha, useTheme } from '@mui/material';
import { motion, AnimatePresence, MotionStyle } from 'framer-motion';

// Framer Motion ile MUI bileşenlerini birleştir
const MotionBox = motion.create(Box);
const MotionButton = motion.create(Button);
const MotionCard = motion.create(Card);
const MotionTypography = motion.create(Typography);

// Animasyon özellikleri
const DEFAULT_DURATION = 0.4;

// Animasyon varyantları
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DEFAULT_DURATION } },
};

const slideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DEFAULT_DURATION, ease: 'easeOut' },
  },
};

const slideDown = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DEFAULT_DURATION, ease: 'easeOut' },
  },
};

const slideLeft = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DEFAULT_DURATION, ease: 'easeOut' },
  },
};

const slideRight = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DEFAULT_DURATION, ease: 'easeOut' },
  },
};

const scale = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DEFAULT_DURATION, ease: 'easeOut' },
  },
};

// Görünürlüğü izleyen bir kapsayıcı
interface AnimateOnScrollProps {
  children: React.ReactNode;
  variant?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale';
  delay?: number;
  duration?: number;
  className?: string;
  style?: MotionStyle;
  threshold?: number;
  once?: boolean;
}

export const AnimateOnScroll: React.FC<AnimateOnScrollProps> = ({
  children,
  variant = 'fadeIn',
  delay = 0,
  duration = DEFAULT_DURATION,
  className,
  style,
  threshold = 0.1,
  once = true,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentRef = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && currentRef) {
            observer.unobserve(currentRef);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [once, threshold]);

  // Varyant seçimi
  let variants;
  switch (variant) {
    case 'slideUp':
      variants = slideUp;
      break;
    case 'slideDown':
      variants = slideDown;
      break;
    case 'slideLeft':
      variants = slideLeft;
      break;
    case 'slideRight':
      variants = slideRight;
      break;
    case 'scale':
      variants = scale;
      break;
    case 'fadeIn':
    default:
      variants = fadeIn;
      break;
  }

  return (
    <MotionBox
      ref={ref}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={variants}
      transition={{ delay, duration }}
      className={className}
      style={style as any}
    >
      {children}
    </MotionBox>
  );
};

// Anım efekti eklenmiş MUI Card
interface AnimatedCardProps {
  title: string;
  subtitle?: string;
  content?: string;
  image?: string;
  imageAlt?: string;
  actions?: React.ReactNode;
  delay?: number;
  onClick?: () => void;
  className?: string;
  style?: MotionStyle;
  hoverEffect?: boolean;
  imageHeight?: number | string;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  title,
  subtitle,
  content,
  image,
  imageAlt,
  actions,
  delay = 0,
  onClick,
  className,
  style,
  hoverEffect = true,
  imageHeight = 200,
}) => {
  const theme = useTheme();
  
  return (
    <MotionCard
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
      className={className}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        ...(style as any),
        ...(hoverEffect && {
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: `0 20px 25px -5px ${alpha(theme.palette.common.black, 0.1)}, 0 10px 10px -5px ${alpha(theme.palette.common.black, 0.04)}`,
          },
        }),
      }}
    >
      {image && (
        <CardMedia
          component="img"
          height={imageHeight}
          image={image}
          alt={imageAlt || title}
          sx={{
            objectFit: 'cover',
          }}
        />
      )}
      <CardContent>
        <MotionTypography
          gutterBottom
          variant="h5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.1, duration: 0.3 }}
        >
          {title}
        </MotionTypography>
        
        {subtitle && (
          <MotionTypography
            variant="subtitle1"
            color="text.secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.2, duration: 0.3 }}
            gutterBottom
          >
            {subtitle}
          </MotionTypography>
        )}
        
        {content && (
          <MotionTypography
            variant="body2"
            color="text.secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.3, duration: 0.3 }}
          >
            {content}
          </MotionTypography>
        )}
      </CardContent>
      
      {actions && (
        <CardActions>
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.4, duration: 0.3 }}
            sx={{ width: '100%' }}
          >
            {actions}
          </MotionBox>
        </CardActions>
      )}
    </MotionCard>
  );
};

// Animasyonlu Buton Bileşeni
interface AnimatedButtonProps {
  children: React.ReactNode;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  onClick?: () => void;
  className?: string;
  style?: MotionStyle;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  delay?: number;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = 'contained',
  color = 'primary',
  onClick,
  className,
  style,
  fullWidth = false,
  startIcon,
  endIcon,
  disabled = false,
  size = 'medium',
  delay = 0,
}) => {
  return (
    <MotionButton
      variant={variant}
      color={color}
      onClick={onClick}
      className={className}
      style={style as any}
      fullWidth={fullWidth}
      startIcon={startIcon}
      endIcon={endIcon}
      disabled={disabled}
      size={size}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
    >
      {children}
    </MotionButton>
  );
};

// Staggered List
interface StaggeredListProps {
  children: React.ReactNode[];
  containerProps?: any;
  delay?: number;
  staggerDelay?: number;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  containerProps,
  delay = 0.1,
  staggerDelay = 0.08,
}) => {
  return (
    <Box {...containerProps}>
      <AnimatePresence>
        {children.map((child, index) => (
          <MotionBox
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: delay + index * staggerDelay, duration: 0.3 }}
          >
            {child}
          </MotionBox>
        ))}
      </AnimatePresence>
    </Box>
  );
};

// Animasyonlu Hero Bölümü
interface AnimatedHeroProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  height?: number | string;
  fullScreen?: boolean;
  centered?: boolean;
  className?: string;
  style?: MotionStyle;
}

export const AnimatedHero: React.FC<AnimatedHeroProps> = ({
  title,
  subtitle,
  children,
  backgroundImage,
  backgroundColor = 'primary.main',
  textColor = 'common.white',
  height = 400,
  fullScreen = false,
  centered = true,
  className,
  style,
}) => {
  const theme = useTheme();
  
  return (
    <MotionBox
      className={className}
      style={style as any}
      sx={{
        position: 'relative',
        height: fullScreen ? '100vh' : height,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: centered ? 'center' : 'flex-start',
        alignItems: centered ? 'center' : 'flex-start',
        padding: theme.spacing(4),
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundColor: backgroundImage ? undefined : backgroundColor,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: textColor,
        textAlign: centered ? 'center' : 'left',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      {backgroundImage && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 1,
          }}
        />
      )}
      
      <Box sx={{ position: 'relative', zIndex: 2, maxWidth: 800 }}>
        <MotionTypography
          variant="h2"
          gutterBottom
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {title}
        </MotionTypography>
        
        {subtitle && (
          <MotionTypography
            variant="h5"
            gutterBottom
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {subtitle}
          </MotionTypography>
        )}
        
        {children && (
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {children}
          </MotionBox>
        )}
      </Box>
    </MotionBox>
  );
};

// Animasyonlu Geçiş Efekti ile Sayfa Değişimi
interface PageTransitionProps {
  children: React.ReactNode;
  transition?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right';
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  transition = 'fade',
}) => {
  let variants;
  
  switch (transition) {
    case 'slide-up':
      variants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -50 },
      };
      break;
    case 'slide-down':
      variants = {
        hidden: { opacity: 0, y: -50 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 50 },
      };
      break;
    case 'slide-left':
      variants = {
        hidden: { opacity: 0, x: 100 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -100 },
      };
      break;
    case 'slide-right':
      variants = {
        hidden: { opacity: 0, x: -100 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 100 },
      };
      break;
    case 'fade':
    default:
      variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      };
      break;
  }
  
  return (
    <AnimatePresence mode='wait'>
      <MotionBox
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={variants}
        transition={{ duration: 0.4 }}
        style={{ width: '100%' }}
      >
        {children}
      </MotionBox>
    </AnimatePresence>
  );
};

const AnimatedComponents = {
  AnimateOnScroll,
  AnimatedCard,
  AnimatedButton,
  StaggeredList,
  AnimatedHero,
  PageTransition,
};

export default AnimatedComponents; 