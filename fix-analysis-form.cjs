const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                </>
              )}
            </div>
          )}`;

const replacement = `                </>
              )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
