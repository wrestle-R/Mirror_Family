import { useState, useEffect } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { MessageCircle, Link2, Plus, List, HelpCircle, Unlink, CheckCircle2, XCircle, Loader2, Copy, RefreshCw } from "lucide-react";

import { Separator } from "@/components/ui/separator";

import { useUser } from "@/context/UserContext";

import { toast } from "sonner";

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Whatsapp = () => {

const { user } = useUser();

// WhatsApp integration state

const [whatsappStatus, setWhatsappStatus] = useState({ isLinked: false, phoneNumber: null });

const [whatsappCode, setWhatsappCode] = useState(null);

const [generatingCode, setGeneratingCode] = useState(false);

const [unlinkingWhatsapp, setUnlinkingWhatsapp] = useState(false);

const [countdown, setCountdown] = useState(0);

// Fetch WhatsApp status

const fetchWhatsappStatus = async () => {

if (!user?.uid) return;

try {

const response = await axios.get(`${API_URL}/api/whatsapp/status/${user.uid}`);

if (response.data.success) {

setWhatsappStatus(response.data.data);

}

} catch (error) {

console.error("Error fetching WhatsApp status:", error);

}

};

// Generate verification code

const handleGenerateCode = async () => {

setGeneratingCode(true);

try {

const response = await axios.post(`${API_URL}/api/whatsapp/generate-code`, {

firebaseUid: user.uid,

email: user.email

});

if (response.data.success) {

setWhatsappCode(response.data.data.code);

setCountdown(response.data.data.expiresIn);

toast.success("Verification code generated!");

}

} catch (error) {

console.error("Error generating WhatsApp code:", error);

if (error.response?.data?.message) {

toast.error(error.response.data.message);

} else {

toast.error("Failed to generate code");

}

} finally {

setGeneratingCode(false);

}

};

// Unlink WhatsApp

const handleUnlinkWhatsapp = async () => {

setUnlinkingWhatsapp(true);

try {

const response = await axios.post(`${API_URL}/api/whatsapp/unlink`, {

firebaseUid: user.uid

});

if (response.data.success) {

setWhatsappStatus({ isLinked: false, phoneNumber: null });

toast.success("WhatsApp unlinked successfully");

}

} catch (error) {

console.error("Error unlinking WhatsApp:", error);

toast.error("Failed to unlink WhatsApp");

} finally {

setUnlinkingWhatsapp(false);

}

};

// Fetch WhatsApp status on mount

useEffect(() => {

fetchWhatsappStatus();

}, [user?.uid]);

// Countdown timer for code expiration

useEffect(() => {

if (countdown <= 0) {

setWhatsappCode(null);

return;

}

const timer = setInterval(() => {

setCountdown(prev => {

if (prev <= 1) {

setWhatsappCode(null);

return 0;

}

return prev - 1;

});

}, 1000);

return () => clearInterval(timer);

}, [countdown]);

// Poll for WhatsApp status after code generation

useEffect(() => {

if (!whatsappCode || whatsappStatus.isLinked) return;

const pollInterval = setInterval(async () => {

await fetchWhatsappStatus();

}, 5000); // Poll every 5 seconds

return () => clearInterval(pollInterval);

}, [whatsappCode, whatsappStatus.isLinked]);

return (

<div className="p-6 max-w-5xl mx-auto space-y-6">

{/* Header */}

<div className="text-center space-y-2">

<div className="flex items-center justify-center gap-3">

<MessageCircle className="w-12 h-12 text-green-500" />

<h1 className="text-4xl font-bold">WhatsApp Integration</h1>

</div>

<p className="text-muted-foreground text-lg">

Manage your finances directly from WhatsApp

</p>

</div>

{/* Link/Unlink Card */}

<Card className="border-l-4 border-l-green-500">

<CardHeader>

<CardTitle className="flex items-center gap-2">

<Link2 className="w-5 h-5 text-green-500" />

{whatsappStatus.isLinked ? "Account Linked" : "Link Your Account"}

</CardTitle>

<CardDescription>

{whatsappStatus.isLinked

? "Your WhatsApp is connected to MoneyCouncil"

: "Connect your WhatsApp to add transactions via chat"}

</CardDescription>

</CardHeader>

<CardContent className="space-y-4">

{whatsappStatus.isLinked ? (

<div className="space-y-4">

<div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">

<CheckCircle2 className="w-5 h-5 text-green-600" />

<div>

<p className="font-medium text-green-700 dark:text-green-400">WhatsApp Linked</p>

<p className="text-sm text-green-600 dark:text-green-500">{whatsappStatus.phoneNumber}</p>

</div>

</div>

<div className="text-sm text-muted-foreground space-y-1">

<p><strong>How to use:</strong></p>

<p>• Add transaction: <code className="bg-muted px-1 rounded">expense, food, 500, Lunch</code></p>

<p>• View history: <code className="bg-muted px-1 rounded">get transactions</code></p>

<p>• Get help: <code className="bg-muted px-1 rounded">help</code></p>

</div>

<Button

variant="outline"

className="text-red-600 border-red-200 hover:bg-red-50"

onClick={handleUnlinkWhatsapp}

disabled={unlinkingWhatsapp}

>

{unlinkingWhatsapp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unlink className="w-4 h-4 mr-2" />}

Unlink WhatsApp

</Button>

</div>

) : (

<div className="space-y-4">

{whatsappCode && countdown > 0 ? (

<div className="space-y-3">

<div className="p-4 bg-primary/10 rounded-lg border">

<div className="flex items-center justify-between">

<div>

<p className="text-sm text-muted-foreground">Your verification code:</p>

<p className="text-2xl font-mono font-bold tracking-wider">{whatsappCode}</p>

</div>

<Button

variant="ghost"

size="icon"

onClick={() => {

navigator.clipboard.writeText(whatsappCode);

toast.success("Code copied!");

}}

>

<Copy className="w-4 h-4" />

</Button>

</div>

<p className="text-sm text-amber-600 mt-2">Expires in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</p>

</div>

<div className="text-sm text-muted-foreground space-y-2">

<p><strong>To link your WhatsApp:</strong></p>

<p>1. Open WhatsApp and send a message to <strong>+1 415 523 8886</strong></p>

<p>2. Send this message:</p>

<code className="block bg-muted p-2 rounded text-sm">

LINK {user?.email} {whatsappCode}

</code>

</div>

<Button

variant="outline"

size="sm"

onClick={handleGenerateCode}

disabled={generatingCode}

>

<RefreshCw className="w-4 h-4 mr-2" />

Generate New Code

</Button>

</div>

) : (

<div className="space-y-3">

<p className="text-sm text-muted-foreground">

Link your WhatsApp to add transactions and check your last 10 transactions via chat messages.

</p>

<Button

onClick={handleGenerateCode}

disabled={generatingCode}

className="bg-green-600 hover:bg-green-700"

>

{generatingCode ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageCircle className="w-4 h-4 mr-2" />}

Generate WhatsApp Code

</Button>

</div>

)}

</div>

)}

</CardContent>

</Card>

{/* Getting Started - Only show if not linked */}

{!whatsappStatus.isLinked && (

<Card>

<CardHeader>

<CardTitle className="flex items-center gap-2">

<CheckCircle2 className="w-5 h-5 text-blue-500" />

Getting Started

</CardTitle>

<CardDescription>Follow these steps to link your WhatsApp</CardDescription>

</CardHeader>

<CardContent className="space-y-4">

<div className="space-y-3">

<div className="flex gap-3">

<div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">

1

</div>

<div>

<h4 className="font-semibold">Join the Sandbox</h4>

<p className="text-sm text-muted-foreground">

Send <code className="bg-muted px-2 py-1 rounded">join &lt;keyword&gt;</code> to <strong>+1 415 523 8886</strong> on WhatsApp

</p>

</div>

</div>

<div className="flex gap-3">

<div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">

2

</div>

<div>

<h4 className="font-semibold">Generate Code</h4>

<p className="text-sm text-muted-foreground">

Click the "Generate WhatsApp Code" button above

</p>

</div>

</div>

<div className="flex gap-3">

<div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">

3

</div>

<div>

<h4 className="font-semibold">Link Your Account</h4>

<p className="text-sm text-muted-foreground">

Send the linking message to the Twilio number:

</p>

<code className="block bg-muted p-2 rounded mt-2">

LINK your@email.com ABC12345

</code>

</div>

</div>

</div>

</CardContent>

</Card>

)}

{/* Commands Section */}

<div className="grid md:grid-cols-2 gap-6">

{/* Add Transaction */}

<Card>

<CardHeader>

<CardTitle className="flex items-center gap-2">

<Plus className="w-5 h-5 text-purple-500" />

Add Transaction

</CardTitle>

<CardDescription>Record income or expenses</CardDescription>

</CardHeader>

<CardContent className="space-y-3">

<div>

<h4 className="font-semibold text-sm mb-1">Format:</h4>

<code className="block bg-muted p-2 rounded text-sm">

type, category, amount, description

</code>

</div>

<div>

<h4 className="font-semibold text-sm mb-1">Examples:</h4>

<code className="block bg-muted p-2 rounded text-sm mb-2">

expense, food, 500, Lunch with friends

</code>

<code className="block bg-muted p-2 rounded text-sm mb-2">

income, salary, 50000, Monthly salary

</code>

<code className="block bg-muted p-2 rounded text-sm">

expense, transportation, 200, Uber to office

</code>

</div>

</CardContent>

</Card>

{/* View Transactions */}

<Card>

<CardHeader>

<CardTitle className="flex items-center gap-2">

<List className="w-5 h-5 text-indigo-500" />

View History

</CardTitle>

<CardDescription>Get your last 10 transactions</CardDescription>

</CardHeader>

<CardContent className="space-y-3">

<div>

<h4 className="font-semibold text-sm mb-1">Commands:</h4>

<code className="block bg-muted p-2 rounded text-sm mb-2">

get transactions

</code>

<code className="block bg-muted p-2 rounded text-sm mb-2">

history

</code>

<code className="block bg-muted p-2 rounded text-sm">

transactions

</code>

</div>

<p className="text-sm text-muted-foreground">

All three commands work the same way. They'll show your most recent transactions with dates, categories, and amounts.

</p>

</CardContent>

</Card>

{/* Help & Unlink */}

<Card>

<CardHeader>

<CardTitle className="flex items-center gap-2">

<HelpCircle className="w-5 h-5 text-amber-500" />

Help & Unlink

</CardTitle>

<CardDescription>Get assistance or disconnect</CardDescription>

</CardHeader>

<CardContent className="space-y-3">

<div>

<h4 className="font-semibold text-sm mb-1">Get Help:</h4>

<code className="block bg-muted p-2 rounded text-sm mb-2">

help

</code>

<code className="block bg-muted p-2 rounded text-sm">

commands

</code>

</div>

<div>

<h4 className="font-semibold text-sm mb-1 mt-4">Unlink Account:</h4>

<code className="block bg-muted p-2 rounded text-sm">

unlink

</code>

</div>

<p className="text-sm text-muted-foreground">

Type "help" or "commands" anytime to see all available options.

</p>

</CardContent>

</Card>

{/* Valid Types & Categories - Compact */}

<Card>

<CardHeader>

<CardTitle>Valid Types & Categories</CardTitle>

<CardDescription>Use these when adding transactions</CardDescription>

</CardHeader>

<CardContent>

<div className="space-y-3 text-sm">

<div>

<p className="font-medium mb-1">Types:</p>

<p className="text-muted-foreground">income, expense, transfer, investment</p>

</div>

<div>

<p className="font-medium text-green-600">Income:</p>

<p className="text-muted-foreground">salary, allowance, freelance, scholarship, gift</p>

</div>

<div>

<p className="font-medium text-red-600">Expense:</p>

<p className="text-muted-foreground">food, transportation, entertainment, shopping, rent, education</p>

</div>

</div>

</CardContent>

</Card>

</div>

{/* Error Messages */}

<Card className="border-l-4 border-l-red-500">

<CardHeader>

<CardTitle className="flex items-center gap-2">

<XCircle className="w-5 h-5 text-red-500" />

Common Errors & Solutions

</CardTitle>

<CardDescription>Troubleshooting guide</CardDescription>

</CardHeader>

<CardContent>

<div className="space-y-4 text-sm">

<div>

<h4 className="font-semibold text-red-600">❌ Invalid linking format</h4>

<p className="text-muted-foreground mb-1">Make sure you have spaces between email and code:</p>

<code className="block bg-muted p-2 rounded">LINK test@gmail.com ABC12345</code>

</div>

<Separator />

<div>

<h4 className="font-semibold text-red-600">❌ Invalid or expired code</h4>

<p className="text-muted-foreground">Codes expire after 5 minutes. Generate a new one above.</p>

</div>

<Separator />

<div>

<h4 className="font-semibold text-red-600">❌ Invalid type or category</h4>

<p className="text-muted-foreground">Check the valid types and categories listed above.</p>

</div>

<Separator />

<div>

<h4 className="font-semibold text-red-600">❌ Invalid amount</h4>

<p className="text-muted-foreground">Amount must be a positive number (e.g., 500, 1000.50)</p>

</div>

</div>

</CardContent>

</Card>

{/* Tips */}

<Card className="bg-primary/5 border-primary/20">

<CardHeader>

<CardTitle>💡 Pro Tips</CardTitle>

</CardHeader>

<CardContent>

<ul className="space-y-2 text-sm">

<li>• Use commas (,) to separate each part of your transaction message</li>

<li>• Description is optional - you can skip it if you want</li>

<li>• Type "help" anytime to see all commands directly in WhatsApp</li>

<li>• You can use ₹ symbol in amounts, it will be ignored: ₹500 works fine</li>

<li>• All transactions are saved immediately and sync with your dashboard</li>

</ul>

</CardContent>

</Card>

</div>

);

};

export default Whatsapp;