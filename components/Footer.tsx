export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500">
        &copy; {new Date().getFullYear()} WhiteClaws. All rights reserved.
      </div>
    </footer>
  );
}
