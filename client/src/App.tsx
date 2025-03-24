import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

import Home from "@/pages/home";
import Cruises from "@/pages/cruises";
import CruiseDetails from "@/pages/cruise-details";
import Booking from "@/pages/booking";
import Checkout from "@/pages/checkout";
import BookingConfirmation from "@/pages/booking-confirmation";
import Profile from "@/pages/profile";
import MyBookings from "@/pages/my-bookings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/cruises" component={Cruises} />
      <Route path="/cruises/:id" component={CruiseDetails} />
      <Route path="/booking/:id" component={Booking} />
      <Route path="/checkout/:bookingId" component={Checkout} />
      <Route path="/booking-confirmation/:id" component={BookingConfirmation} />
      <Route path="/profile" component={Profile} />
      <Route path="/my-bookings" component={MyBookings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
