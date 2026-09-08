"use client"
import React, { useEffect, useState } from 'react'
import axios from "axios";
import { UserDetailContext } from '@/context/UserDetailContext';
import { useUser } from '@clerk/nextjs';

function Provider({children}:{children:React.ReactNode}) {
    const [userDetail,setUserDetail]=useState<any>();
    const { user, isLoaded } = useUser();

    const CreateNewUser = async () => {
      try {
        const payload = user ? {
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "User",
          email: user.primaryEmailAddress?.emailAddress
        } : {};
        const result = await axios.post("/api/users", payload);
        console.log(result.data);
        setUserDetail(result.data);
      } catch (err: any) {
        console.error("Error creating/fetching user:", err);
      }
    };

    useEffect(()=>{
        if (isLoaded) {
          CreateNewUser();
        }
    }, [isLoaded, user])

  return (
    <UserDetailContext.Provider value={{userDetail,setUserDetail}}>
        <div>{children}</div>
    </UserDetailContext.Provider>
  )
}

export default Provider