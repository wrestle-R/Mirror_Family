import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Link2, Plus, List, HelpCircle, Unlink, CheckCircle2, XCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Whatsapp = () => {
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

      {/* Getting Started */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
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
                  Go to your <a href="/profile" className="text-primary hover:underline">Profile page</a> → Goals tab → WhatsApp Integration → Click "Generate WhatsApp Code"
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

      {/* Commands Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Link Command */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-500" />
              Link Account
            </CardTitle>
            <CardDescription>Connect your WhatsApp to MoneyCouncil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">Format:</h4>
              <code className="block bg-muted p-2 rounded text-sm">
                LINK email@example.com CODE
              </code>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Example:</h4>
              <code className="block bg-muted p-2 rounded text-sm">
                LINK test@gmail.com G87AD4QH
              </code>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Requirements:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Valid email address</li>
                <li>8-character code from Profile</li>
                <li>Code expires in 5 minutes</li>
                <li>Use spaces between parts</li>
              </ul>
            </div>
          </CardContent>
        </Card>

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
      </div>

      {/* Valid Types & Categories */}
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader>
          <CardTitle>Valid Types & Categories</CardTitle>
          <CardDescription>Use these when adding transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Transaction Types:</h4>
              <ul className="space-y-1 text-sm">
                <li><span className="font-mono bg-muted px-2 py-0.5 rounded">income</span> - Money you receive</li>
                <li><span className="font-mono bg-muted px-2 py-0.5 rounded">expense</span> - Money you spend</li>
                <li><span className="font-mono bg-muted px-2 py-0.5 rounded">transfer</span> - Move between accounts</li>
                <li><span className="font-mono bg-muted px-2 py-0.5 rounded">investment</span> - Investing money</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Common Categories:</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-green-600">Income:</p>
                  <p className="text-muted-foreground">salary, allowance, freelance, scholarship, gift, refund</p>
                </div>
                <div>
                  <p className="font-medium text-red-600">Expense:</p>
                  <p className="text-muted-foreground">food, transportation, entertainment, shopping, rent, education, healthcare, groceries, dining_out</p>
                </div>
                <div>
                  <p className="font-medium text-blue-600">Investment:</p>
                  <p className="text-muted-foreground">stocks, mutual_funds, crypto, fixed_deposit, gold</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
              <p className="text-muted-foreground">Codes expire after 5 minutes. Generate a new one from your Profile page.</p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold text-red-600">❌ Invalid type</h4>
              <p className="text-muted-foreground mb-1">Must be one of: income, expense, transfer, investment</p>
              <code className="block bg-muted p-2 rounded">expense, food, 500, Lunch</code>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold text-red-600">❌ Invalid category</h4>
              <p className="text-muted-foreground">Check the list above for valid categories. Use underscores for multi-word categories like dining_out</p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold text-red-600">❌ Invalid amount</h4>
              <p className="text-muted-foreground mb-1">Amount must be a positive number:</p>
              <code className="block bg-muted p-2 rounded mb-1">✓ 500</code>
              <code className="block bg-muted p-2 rounded mb-1">✓ 1000.50</code>
              <code className="block bg-muted p-2 rounded">✗ -500</code>
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
            <li>• If you're not sure about a category, the system will try to find a close match</li>
            <li>• All transactions are saved immediately and sync with your dashboard</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Whatsapp;
