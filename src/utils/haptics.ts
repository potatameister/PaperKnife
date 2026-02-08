import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const hapticImpact = async (style = ImpactStyle.Medium) => {
  if (Capacitor.isNativePlatform() && localStorage.getItem('hapticsEnabled') !== 'false') {
    try {
      await Haptics.impact({ style });
    } catch (e) {
      console.warn('Haptics not supported');
    }
  }
};

export const hapticSuccess = async () => {
  if (Capacitor.isNativePlatform() && localStorage.getItem('hapticsEnabled') !== 'false') {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      console.warn('Haptics not supported');
    }
  }
};

export const hapticSelection = async () => {
  if (Capacitor.isNativePlatform() && localStorage.getItem('hapticsEnabled') !== 'false') {
    try {
      await Haptics.selectionStart();
    } catch (e) {
      console.warn('Haptics not supported');
    }
  }
};
