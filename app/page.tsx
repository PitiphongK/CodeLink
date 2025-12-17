"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from "@heroui/react";
import { ThemeSwitcher } from './components/theme-switcher';

export default function Home() {
  const [joinRoomId, setJoinRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [step, setStep] = useState('initial'); // 'initial', 'join-name', 'create-name'
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Pre-fill username if it exists in session storage
    const storedUserName = sessionStorage.getItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
    }
    // If arriving with a join param, prefill room and show name step
    const joinId = searchParams?.get('join');
    if (joinId) {
      setJoinRoomId(joinId);
      if (!storedUserName) {
        setStep('join-name');
      }
    }
  }, [searchParams, router]);

  const handleJoinRoom = () => {
    if (userName.trim() && joinRoomId.trim()) {
      sessionStorage.setItem('userName', userName.trim());
      router.push(`/rooms/${joinRoomId.replace(/\s/g, '')}`);
    } else {
      alert("Please enter your name.");
    }
  };

  const handleCreateRoom = () => {
    if (userName.trim()) {
      sessionStorage.setItem('userName', userName.trim());
      const newRoomId = Math.random().toString(36).substring(2, 10);
      router.push(`/rooms/${newRoomId}`);
    } else {
      alert("Please enter your name.");
    }
  };

  const renderInitial = () => (
    <>
      <div className="flex flex-col items-start p-8 w-full md:w-1/2">
        <h2 className="text-2xl font-semibold mb-1">Join a room</h2>
        <p className="text-sm font-medium mb-5 text-gray-500">
          Join an existing pair programming session.
        </p>
        <Input
          placeholder="Enter Room ID"
          size="lg"
          type="text"
          className="mb-4 w-full"
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value)}
        />
        <Button color="primary" onPress={() => setStep('join-name')} disabled={!joinRoomId.trim()}>
          Join
        </Button>
      </div>

      <div className="hidden md:block w-px bg-gray-300 dark:bg-gray-700 h-64 mx-8"></div>

      <div className="flex flex-col items-start p-8 w-full md:w-1/2">
        <h2 className="text-2xl font-semibold mb-1">Create a room</h2>
        <p className="text-sm font-medium mb-5 text-gray-500">
          Start a new pair programming session.
        </p>
        <Button color="primary" onPress={() => setStep('create-name')}>
          Create
        </Button>
      </div>
    </>
  );

  const renderNameStep = (isJoining: boolean) => (
    <div className="flex flex-col items-start px-4 w-full max-w-sm">
      <button className="mb-4 text-sm text-gray-500" onClick={() => setStep('initial')}>
        &larr; Back
      </button>
      <h2 className="text-2xl font-semibold mb-1">What&apos;s your name?</h2>
      <p className="text-sm font-medium mb-5 text-gray-500">
        This will be your display name in the session.
      </p>
      <Input
        placeholder="Enter your name"
        size="lg"
        type="text"
        className="mb-4"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        autoFocus
      />
      <Button color="primary" onPress={isJoining ? handleJoinRoom : handleCreateRoom} disabled={!userName.trim()}>
        {isJoining ? 'Enter Room' : 'Create Room'}
      </Button>
    </div>
  );

  return (
    <main>
      <div className="min-h-screen flex flex-col items-center py-8 px-4">
        <div className="mb-20 text-2xl">
          CodeLink
        </div>
        
        <div className="flex items-start justify-center w-full max-w-4xl">
          {step === 'initial' && renderInitial()}
          {step === 'join-name' && renderNameStep(true)}
          {step === 'create-name' && renderNameStep(false)}
        </div>
      </div>
      
      <ThemeSwitcher />
    </main>
  );
}
