"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateRoomCode, normalizeRoomCode } from '@/app/utils/roomCode';
import type { RoomEntryStep } from '@/app/interfaces/types';

export function useRoomLanding() {
  const [joinRoomId, setJoinRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [step, setStep] = useState<RoomEntryStep>('initial');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  

  useEffect(() => {
    const storedUserName = sessionStorage.getItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
    }
    const joinId = searchParams?.get('join');
    if (joinId) {
      setJoinRoomId(joinId);
      if (!storedUserName) {
        setStep('join-name');
      }
    }
  }, [searchParams]);

  const handleJoinRoom = () => {
    setIsSubmitting(true);
    const name = userName.trim();
    const normalized = normalizeRoomCode(joinRoomId);
    if (!name) {
      alert('Please enter your name.');
      setIsSubmitting(false);
      return;
    }
    if (!normalized) {
      alert('Invalid room code. Please use format XXX-XXX-XXX.');
      setIsSubmitting(false);
      return;
    }
    sessionStorage.setItem('userName', name);
    router.push(`/rooms/${normalized}`);
  };

  const handleCreateRoom = async () => {
    console.log('Creating room...');
    setIsSubmitting(true);
    const name = userName.trim();
    if (!name) {
      alert('Please enter your name.');
      setIsSubmitting(false);
      return;
    }
    sessionStorage.setItem('userName', name);
    const newRoomCode = generateRoomCode();

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newRoomCode }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to create room. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Only navigate after successful room creation
      router.push(`/rooms/${newRoomCode}`);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  const isExistingRoom = async (roomId: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/rooms?id=${roomId}`);
      if (!response.ok) return false;
      const data = await response.json();
      return !!data.room;
    } catch (error) {
      console.error('Error checking room existence:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    joinRoomId,
    setJoinRoomId,
    userName,
    setUserName,
    step,
    setStep,
    handleJoinRoom,
    handleCreateRoom,
    isSubmitting,
    isExistingRoom,
  } as const;
}
