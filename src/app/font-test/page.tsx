export default function FontTestPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Chillax SemiBold - Headings */}
        <section>
          <div className="mb-8">
            <h2 className="font-chillax text-heading-md text-black mb-4">Chillax SemiBold - Headings</h2>
            <p className="font-avenir text-body-md text-gray-600">Used for all headings (h1-h6)</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <h1 className="font-chillax text-heading-main text-black">
                Main Heading - 64px/64px
              </h1>
              <p className="font-avenir text-body-sm text-gray-500 mt-1">font-chillax text-heading-main</p>
            </div>
            
            <div>
              <h2 className="font-chillax text-heading-lg text-black">
                Large Heading - 48px/48px
              </h2>
              <p className="font-avenir text-body-sm text-gray-500 mt-1">font-chillax text-heading-lg</p>
            </div>
            
            <div>
              <h3 className="font-chillax text-heading-md text-black">
                Medium Heading - 32px/36px
              </h3>
              <p className="font-avenir text-body-sm text-gray-500 mt-1">font-chillax text-heading-md</p>
            </div>
            
            <div>
              <h4 className="font-chillax text-heading-sm text-black">
                Small Heading - 24px/28px
              </h4>
              <p className="font-avenir text-body-sm text-gray-500 mt-1">font-chillax text-heading-sm</p>
            </div>
          </div>
        </section>

        {/* Avenir Next Regular - Body Text */}
        <section>
          <div className="mb-8">
            <h2 className="font-chillax text-heading-md text-black mb-4">Avenir Next Regular - Body Text</h2>
            <p className="font-avenir text-body-md text-gray-600">Used for all body text, buttons, and UI elements</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="font-avenir text-body-lg text-black">
                Large Body Text - 24px/36px - AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTt
              </p>
              <p className="font-avenir text-body-sm text-gray-500 mt-1">font-avenir text-body-lg</p>
            </div>
            
            <div>
              <p className="font-avenir text-body-md text-black">
                Medium Body Text - 18px/28px - AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTt
              </p>
              <p className="font-avenir text-body-sm text-gray-500 mt-1">font-avenir text-body-md</p>
            </div>
            
            <div>
              <p className="font-avenir text-body-sm text-black">
                Small Body Text - 16px/24px - AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTt
              </p>
              <p className="font-avenir text-body-sm text-gray-500 mt-1">font-avenir text-body-sm</p>
            </div>
            
            <div>
              <p className="font-avenir text-body-xs text-black">
                Extra Small Body Text - 14px/20px - AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTt
              </p>
              <p className="font-avenir text-body-sm text-gray-500 mt-1">font-avenir text-body-xs</p>
            </div>
          </div>
        </section>

        {/* UI Elements */}
        <section>
          <div className="mb-8">
            <h2 className="font-chillax text-heading-md text-black mb-4">UI Elements</h2>
            <p className="font-avenir text-body-md text-gray-600">Buttons, inputs, and form elements</p>
          </div>
          
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
              <button className="font-avenir bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                Primary Button
              </button>
              <button className="font-avenir bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors">
                Secondary Button
              </button>
            </div>
            
            <div className="max-w-md">
              <label className="font-avenir block text-body-sm font-medium text-gray-700 mb-2">
                Input Field
              </label>
              <input 
                type="text" 
                placeholder="Type something here..."
                className="font-avenir w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="max-w-md">
              <label className="font-avenir block text-body-sm font-medium text-gray-700 mb-2">
                Textarea
              </label>
              <textarea 
                placeholder="Enter your message..."
                rows={4}
                className="font-avenir w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </section>

        {/* Font Specifications */}
        <section className="bg-gray-50 p-6 rounded-lg">
          <h2 className="font-chillax text-heading-md text-black mb-6">Font Specifications</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-chillax text-heading-sm text-black mb-4">Chillax SemiBold</h3>
              <div className="font-avenir text-body-sm space-y-2">
                <p><strong>Family:</strong> __chillaxSemiBold_be0536</p>
                <p><strong>Weight:</strong> 400</p>
                <p><strong>Usage:</strong> All headings (h1-h6)</p>
                <p><strong>Main Size:</strong> 64px/64px</p>
                <p><strong>Color:</strong> #000000</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-chillax text-heading-sm text-black mb-4">Avenir Next Regular</h3>
              <div className="font-avenir text-body-sm space-y-2">
                <p><strong>Family:</strong> __avenirNextRegular_4a7275</p>
                <p><strong>Weight:</strong> 400</p>
                <p><strong>Usage:</strong> Body text, UI elements</p>
                <p><strong>Main Size:</strong> 24px/36px</p>
                <p><strong>Color:</strong> #000000</p>
              </div>
            </div>
          </div>
        </section>

        {/* Instructions */}
        <section className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <h2 className="font-chillax text-heading-sm text-black mb-4">⚠️ Font Files Required</h2>
          <div className="font-avenir text-body-sm space-y-2">
            <p>To see the custom fonts, please add these files to <code className="bg-gray-200 px-2 py-1 rounded">/src/app/fonts/</code>:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>ChillaxSemiBold.woff2</strong> - For headings</li>
              <li><strong>AvenirNextRegular.woff2</strong> - For body text</li>
            </ul>
            <p className="mt-4">Currently using system font fallbacks until actual font files are added.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
