"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from "@heroui/react";
import { ThemeSwitcher } from './components/theme-switcher';

export default function Home() {
  const [joinRoomId, setJoinRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [createStep, setCreateStep] = useState(0); // 0: initial, 1: enter name
  const router = useRouter();

  const handleJoinRoom = () => {
    if (joinRoomId) {
      router.push(`/rooms/${joinRoomId.replace(/\s/g, '')}`);
    }
  };

  const handleProceedToNameStep = () => {
    setCreateStep(1);
  };

  const handleCreateRoom = () => {
    if (userName.trim()) {
      const newRoomId = Math.random().toString(36).substring(2, 10);
      router.push(`/rooms/${newRoomId}?username=${encodeURIComponent(userName.trim())}`);
    } else {
      // Optional: Add user feedback for empty name
      alert("Please enter your name.");
    }
  };

  return (
    <main>
      <div className="min-h-screen flex flex-col items-center py-8 px-4">
          <div className="mb-20 text-2xl">
            CodeLink
          </div>
        
        <div className={`flex items-start justify-center w-full max-w-4xl ${createStep === 1 ? 'justify-center' : ''}`}>
          {createStep === 0 && (
            <>
              <div className="flex flex-col items-start p-8 w-full md:w-1/2">
                <h2 className="text-2xl font-semibold mb-1">Join a room</h2>
                <p className="text-sm font-medium mb-5 text-gray-500">
                  Join an existing room and start coding!
                </p>
                <Input
                  placeholder="1234 5678"
                  size="lg"
                  type="text"
                  className="mb-4"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                />
                <Button color="primary" onPress={handleJoinRoom}>Enter</Button>
              </div>

              <div className="hidden md:block w-px bg-gray-300 dark:bg-gray-700 h-64 mx-8"></div>
            </>
          )}

          <div className={`flex flex-col items-start p-8 w-full ${createStep === 0 ? 'md:w-1/2' : 'max-w-sm'}`}>
            {createStep === 0 ? (
              <>
                <h2 className="text-2xl font-semibold mb-1">Create a room</h2>
                <p className="text-sm font-medium mb-5 text-gray-500">
                  Start a new pair programming session and invite collaborators!
                </p>
                <Button color="primary" onPress={handleProceedToNameStep}>Create</Button>
              </>
            ) : (
              <div className="flex flex-col items-start px-4 w-full">
                <h2 className="text-2xl font-semibold mb-1">What&apos;s your name?</h2>
                <p className="text-sm font-medium mb-5 text-gray-500">
                  Please enter your name to create a room.
                </p>
                <Input
                  placeholder="Phong"
                  size="lg"
                  type="text"
                  className="mb-4"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  autoFocus
                />
                <Button color="primary" onPress={handleCreateRoom}>Create Room</Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <ThemeSwitcher />
    </main>
  );
}
