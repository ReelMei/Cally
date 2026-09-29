import { ArrowRight, Keyboard, Plus, ShieldCheck } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth, useUser } from "@clerk/react";
import api from "../Config/api.js";

const Dashboard = () => {
  const { user } = useUser();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();

  const [isCreating, setIsCreating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [joinId, setJoinId] = useState("");

  const userName = user?.fullName || "User";
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";

  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch meeting stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!isLoaded || !isSignedIn) return;

      try {
        const token = await getToken();

        const { data } = await api.get("/api/meetings/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setStats(data);
      } catch (error) {
        toast.error(error.response?.data?.error || error.message);
      }
    };

    fetchStats();
  }, [isLoaded, isSignedIn, getToken]);

  // Create meeting
  const handleCreateMeeting = async () => {
    if (!isLoaded || !isSignedIn) return;

    setIsCreating(true);

    try {
      const token = await getToken();

      const res = await api.post(
        "/api/meetings",
        {
          title: `${userName}'s Meeting`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const meetingId = res.data.meeting.meetingId;

      toast.success("Room Created, Cheers!");
      navigate(`/meeting/${meetingId}`);
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Join meeting
  const handleJoinMeeting = async (e) => {
    e.preventDefault();

    const cleanId = joinId.trim();

    if (!/^[a-z0-9]{3}(?:-[a-z0-9]{3}){2}$/.test(cleanId)) {
      toast.error("Enter a Valid Room ID");
      return;
    }

    try {
      const token = await getToken();

      await api.get(`/api/meetings/${cleanId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate(`/meeting/${cleanId}`);
    } catch (error) {
      toast.error("Meeting not found. Check and try again, Cheers!");
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 md:p-12 flex flex-col justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left */}
        <div className="lg:col-span-7 space-y-8 w-full">
          <div className="space-y-3">
            {/* Security Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 pr-6 py-2 rounded-full bg-white/10 text-xs font-medium max-w-full">
              <ShieldCheck size={16} className="shrink-0" />

              <span className="text-black whitespace-normal">
                Secure Peer-To-Peer Encryption
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl text-slate-800 leading-tight font-bold pt-3 wrap-break-word">
              High Quality Video Calls.
              <br />
              <span className="text-primary">Built With you in mind.</span>
            </h1>

            {/* Description */}
            <p className="text-slate-900 text-base sm:text-lg max-w-xl leading-relaxed">
              Connect, Collab and Yap from anywhere, anytime with ultra-low
              latency video, screen sharing and real time chat.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              {/* New Meeting */}
              <button
                onClick={handleCreateMeeting}
                disabled={isCreating}
                className="bg-primary hover:bg-primary-hover text-white font-medium px-6 py-3.5 rounded-full shadow-md shadow-primary/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />

                <span>{isCreating ? "Hold Up, Creating" : "New Meeting"}</span>
              </button>

              {/* Join Meeting */}
              <form
                onSubmit={handleJoinMeeting}
                className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full"
              >
                <div className="flex-1 relative w-full">
                  <Keyboard className="w-5 h-5 text-primary/90 absolute left-4 top-1/2 -translate-y-1/2" />

                  <input
                    type="text"
                    placeholder="Enter Unique Room Code (e.g. abc-def-ghi)"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    className="w-full bg-white/75 border border-primary-border/80 focus:border-primary/60 focus:ring-1 focus:ring-primary/60 rounded-full pl-12 pr-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!joinId.trim()}
                  className="bg-blue-500 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-red-500 text-white font-medium px-6 py-3.5 rounded-full transition-all flex items-center justify-center cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <span>Join</span>

                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4 w-full">
          <div className="w-full bg-white/25 backdrop-blur rounded-4xl p-5 sm:p-8 border border-slate-200 text-center space-y-6 relative">
            {/* Greeting / Time */}
            <div className="space-y-1">
              <p className="mb-5 text-xl text-left text-black">
                Cheers,{" "}
                <span className="font-medium text-blue-800">{userName}!</span>
              </p>

              <h2 className="text-3xl sm:text-5xl xl:text-7xl my-4 text-black tracking-wide">
                {currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </h2>

              <p className="font-medium text-primary tracking-wider text-sm sm:text-base">
                {currentTime.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Account Information */}
            <div className="pt-4 border-t border-white/30 text-sm text-slate-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-6 px-2 sm:px-4">
                <p className="text-left wrap-break-word">
                  Logged in as: <span className="break-all">{userEmail}</span>
                </p>

                <span
                  className={` self-start sm:self-auto px-4 py-1 rounded-full font-semibold text-xs uppercase ${
                    stats?.plan === "premium"
                      ? "bg-blue-700 text-white"
                      : "text-slate-800"
                  }`}
                >
                  {stats?.plan || "Free"}
                </span>
              </div>

              {/* Meeting Usage */}
              {stats && (
                <div className="w-full bg-white/50 rounded-2xl px-4 sm:px-5 py-4 border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                    <span>Monthly Meetings</span>

                    <span className="text-xs text-slate-600 font-mono">
                      {stats.monthlyLimit
                        ? `${stats.monthlyCount} / ${stats.monthlyLimit} used`
                        : `${stats.monthlyCount} Created (Unlimited)`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
