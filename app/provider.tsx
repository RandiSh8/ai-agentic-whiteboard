"use client"
import React, { useEffect, useState } from 'react'
import axios from "axios";
import { UserDetailContext } from '@/context/UserDetailContext';

function Provider({children}:{children:React.ReactNode}) {
    const [userDetail,setUserDetail]=useState<any>();

    const CreateNewUser = async() => {
        const result=await axios.post("/api/users");
        console.log(result.data);
        setUserDetail(result.data);
    }

    useEffect(()=>{
        CreateNewUser();
    },[])
  return (
    <UserDetailContext.Provider value={{userDetail,setUserDetail}}>
        <div>{children}</div>
    </UserDetailContext.Provider>
    
  )
}

export default Provider